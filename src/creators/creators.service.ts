import {
    BadRequestException,
    Inject,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
    UnauthorizedException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { addDays, isPast } from 'date-fns'
import { and, eq, inArray, lt, sql } from 'drizzle-orm'
import { render } from 'react-email'
import { Resend } from 'resend'
import { dbConnection, type PgDB } from 'src/database/database.module'
import { mailService } from 'src/mails/mails.module'
import { paymentService, type PaymentService } from 'src/payments/payments.module'
import { creatorBalances, creatorEarnings, products, userWallets, users } from 'src/schema'
import { AuthenticatedUserPayload } from 'utils/https/guards'
import { earningsDistributedTemplate } from 'utils/mails/creator-earnings-distributed'
import { CreateUserWithdrawnRequest } from './dto/creators.dto'

type SummaryProduct = {
    productId: string
    productName: string
    productPrice: number
    productDownloadCount: number
    productPreviewImages: {
        id: string
        createdAt: Date
        updatedAt: Date
        productId: string
        mediaUrl: string
    }[]
}

type MergeCreatorEarningsPayload = {
    id: string
    creatorId: string
    amount: number
    status: 'pending' | 'settled' | 'distributed'
    availableAt: Date | null
}

@Injectable()
export class CreatorsService {
    private readonly logger = new Logger(CreatorsService.name)

    constructor(
        private readonly configService: ConfigService,
        @Inject(dbConnection) private readonly db: PgDB,
        @Inject(mailService) private readonly resend: Resend,
        @Inject(paymentService) private readonly paymentService: PaymentService
    ) {}

    async getDashboardSummaryProduct(creator: AuthenticatedUserPayload) {
        const summaryProduct = await this.db
            .select({
                productId: products.id,
                productName: products.name,
                productPrice: products.price,
                productDownloadCount: products.downloadsCount
            })
            .from(products)
            .where(eq(products.creatorId, creator.userId))

        if (summaryProduct.length === 0) return []

        const productPreviewImages = await this.db.query.productPreviewImages.findMany({
            where: p =>
                inArray(
                    p.productId,
                    summaryProduct.map(sp => sp.productId)
                )
        })

        if (productPreviewImages.length === 0) return []

        const data = summaryProduct.reduce((arr: SummaryProduct[], current) => {
            arr.push({
                ...current,
                productPreviewImages: productPreviewImages.filter(p => p.productId === current.productId)
            })
            return arr
        }, [])

        if (data.length === 0) return []
        return data
    }

    async getCreatorBalances(creator: AuthenticatedUserPayload) {
        const creatorBalances = await this.db.query.creatorBalances.findFirst({
            where: cb => eq(cb.creatorId, creator.userId)
        })
        if (!creatorBalances) throw new NotFoundException('Creator Balances Not Found')
        return creatorBalances
    }

    async getWithdrawalCreatorBalances(creator: AuthenticatedUserPayload) {
        const creatorBalances = await this.db.query.creatorBalances.findFirst({
            where: cb => eq(cb.creatorId, creator.userId)
        })
        if (!creatorBalances) throw new NotFoundException('Creator Balances Not Found')

        // BUGS: FIX ADD "AND METHOD TO INCLUDE CREATOR_ID"
        const setteldCreatorEarnings = await this.db.query.creatorEarnings.findMany({
            where: ce => and(eq(ce.status, 'settled'), eq(ce.creatorId, creator.userId))
        })
        if (setteldCreatorEarnings.length === 0) {
            return { balance: creatorBalances.balance, balanceToWithdrawn: creatorBalances.balance }
        }

        const calcCreatorEarningsSettled = setteldCreatorEarnings.reduce((t, c) => t + c.amount, 0)
        return {
            balance: creatorBalances.balance + calcCreatorEarningsSettled,
            balanceToWithdrawn: creatorBalances.balance
        }
    }

    async getWithdrawalHistory(creator: AuthenticatedUserPayload) {
        const withdrawalHistory = await this.db.query.withdrawals.findMany({ where: w => eq(w.userId, creator.userId) })
        if (withdrawalHistory.length === 0) return { withdrawalHistory: [] }
        return { withdrawalHistory }
    }

    async getUserWallet(creator: AuthenticatedUserPayload) {
        const wallet = await this.db.query.userWallets.findFirst({
            where: uw => eq(uw.userId, creator.userId)
        })

        return wallet
    }

    // TODO: CREATE BENEFICIERIES IN MIDTRANS
    async createUserWallet(creator: AuthenticatedUserPayload, params: { type: 'bank' | 'e-wallet'; name: string; number: number; holder: string }) {
        const [user] = await this.db.select().from(users).where(eq(users.id, creator.userId))
        if (!user) throw new UnauthorizedException()

        const aliasName = user.name.toLowerCase().replace(/[^a-z0-9]/g, '')
        const existing = await this.db.query.userWallets.findFirst({
            where: uw => eq(uw.userId, creator.userId)
        })

        if (existing) {
            return await this.db.transaction(async tx => {
                const cooldownEnd = addDays(existing.createdAt, 90)
                if (!isPast(cooldownEnd)) throw new BadRequestException('Wallet can only be updated 90 days after creation')

                const [updated] = await tx
                    .update(userWallets)
                    .set({ type: params.type, name: params.name, number: params.number, holder: params.holder })
                    .where(eq(userWallets.userId, creator.userId))
                    .returning()

                const responseBenf = (await this.paymentService.irisCreatorApi.updateBeneficiaries(aliasName, {
                    name: updated.holder,
                    account: String(updated.number),
                    bank: updated.name,
                    alias_name: aliasName,
                    email: user.email
                })) as { status: string }

                if (responseBenf.status !== 'created') this.logger.error({ responseBenfErr: responseBenf })
                this.logger.debug({ responseBenf })

                return updated
            })
        }

        return await this.db.transaction(async tx => {
            const [wallet] = await tx
                .insert(userWallets)
                .values({ userId: creator.userId, type: params.type, name: params.name, number: params.number, holder: params.holder })
                .returning()

            const responseBenf = (await this.paymentService.irisCreatorApi.createBeneficiaries({
                name: wallet.holder,
                account: String(wallet.number),
                bank: wallet.name,
                alias_name: aliasName,
                email: user.email
            })) as { status: string }

            if (responseBenf.status !== 'created') this.logger.error({ responseBenfErr: responseBenf })
            this.logger.debug({ responseBenf })

            return wallet
        })
    }

    async createUserWithdrawn(creator: AuthenticatedUserPayload, param: CreateUserWithdrawnRequest) {
        try {
            const [userWallet] = await this.db.select().from(userWallets).where(eq(userWallets.userId, creator.userId))
            if (!userWallet) throw new NotFoundException('User Wallet Not Foumd')

            const [creatorBalance] = await this.db.select().from(creatorBalances).where(eq(creatorBalances.creatorId, creator.userId))
            if (!creatorBalance) throw new NotFoundException('Creator Balance Not Foumd')

            const payoutPayload = [
                {
                    beneficiary_name: userWallet.holder,
                    beneficiary_account: userWallet.number,
                    beneficiary_bank: userWallet.name,
                    beneficiary_email: creator.email,
                    amount: String(param.gross_amount_request),
                    notes: 'Payout test'
                }
            ]

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const createPayout = await this.paymentService.irisCreatorApi.createPayouts({ payouts: payoutPayload })
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            console.log({ createPayout })
            return creatorBalance
        } catch (err) {
            console.log(err)
        }
    }

    async releaseCreatorEarningsToBalance() {
        const now = new Date()
        const findCreatorEarnings = await this.db.query.creatorEarnings.findMany({
            where: ce => and(eq(ce.status, 'settled'), lt(ce.availableAt, now))
        })

        if (findCreatorEarnings.length === 0) {
            this.logger.debug("Creator Earning With 'Settled' Status Not Found ")
            return
        }

        const mergeCreatorEarningsPayload = findCreatorEarnings.reduce((arr: MergeCreatorEarningsPayload[], current) => {
            const isSameCreator = arr.find(obj => obj.creatorId === current.creatorId)
            if (isSameCreator) {
                isSameCreator.amount += current.amount
            } else {
                arr.push({
                    id: current.id,
                    creatorId: current.creatorId,
                    amount: current.amount,
                    status: 'settled',
                    availableAt: current.availableAt
                })
            }

            return arr
        }, [])

        if (mergeCreatorEarningsPayload.length === 0) return

        await this.db.transaction(async tx => {
            for (const currentCreatorEarning of mergeCreatorEarningsPayload) {
                const [updateCreatorBalance] = await tx
                    .update(creatorBalances)
                    .set({
                        balance: sql`${creatorBalances.balance} + COALESCE(${currentCreatorEarning.amount}, 0)`,
                        lastSettledAt: now
                    })
                    .where(eq(creatorBalances.creatorId, currentCreatorEarning.creatorId))
                    .returning()

                if (!updateCreatorBalance) throw new InternalServerErrorException('Update Creator Balance Failed')

                const [updateCreatorEarnings] = await tx
                    .update(creatorEarnings)
                    .set({
                        status: 'distributed'
                    })
                    .where(and(eq(creatorEarnings.id, currentCreatorEarning.id)))
                    .returning()

                if (!updateCreatorEarnings) throw new InternalServerErrorException('Update Creator Earnings Failed')
                this.logger.debug('Crob Job Is Running, Updating Creator Balance And Creator Earnings Is Successful')
            }
        })

        await Promise.all(
            mergeCreatorEarningsPayload.map(async m => {
                const [{ creatorEmail }] = await this.db.select({ creatorEmail: users.email }).from(users).where(eq(users.id, m.creatorId))
                if (!creatorEmail) throw new NotFoundException('Creator Not Foumd')

                const emailRender = await render(earningsDistributedTemplate({ totalAmount: m.amount, distributedAt: new Date() }))
                const sendEmail = await this.resend.emails.send({
                    from: `Pickblue <creator${this.configService.getOrThrow('APP_MAIL_NAME')}>`,
                    to: creatorEmail,
                    subject: 'Creator Balance Update',
                    html: emailRender
                })
                if (sendEmail.error !== null) throw new InternalServerErrorException('Sending Email Failed')
            })
        )
    }
}
