import { relations } from 'drizzle-orm'
import { users } from './users'
import { accounts } from './accounts'
import { sessions } from './sessions'
import { verifications } from './verifications'
import { roles, userRoles } from './roles'
import { products } from './products'
import { productFiles } from './product_files'
import { productPreviewImages } from './product_preview_images'
import { cartItems } from './cart_items'
import { productLikes } from './product_likes'
import { orders, orderItems } from './orders'
import { payments } from './payments'
import { userPurchases } from './user_purchases'
import { creatorEarnings } from './creator_earnings'
import { creatorBalances } from './creator_balances'
import { withdrawals } from './withdrawals'

export const usersRelations = relations(users, ({ many }) => ({
    accounts: many(accounts),
    sessions: many(sessions),
    verifications: many(verifications),
    userRoles: many(userRoles),
    products: many(products),
    orders: many(orders),
    cartItems: many(cartItems),
    productLikes: many(productLikes),
    userPurchases: many(userPurchases),
    creatorEarnings: many(creatorEarnings),
    creatorBalances: many(creatorBalances),
    withdrawals: many(withdrawals)
}))

export const accountsRelations = relations(accounts, ({ one }) => ({
    user: one(users, {
        fields: [accounts.userId],
        references: [users.id]
    })
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, {
        fields: [sessions.userId],
        references: [users.id]
    })
}))

export const verificationsRelations = relations(verifications, ({ one }) => ({
    user: one(users, {
        fields: [verifications.userId],
        references: [users.id]
    })
}))

export const rolesRelations = relations(roles, ({ many }) => ({
    userRoles: many(userRoles)
}))

export const userRolesRelations = relations(userRoles, ({ one }) => ({
    user: one(users, {
        fields: [userRoles.userId],
        references: [users.id]
    }),
    role: one(roles, {
        fields: [userRoles.roleId],
        references: [roles.id]
    })
}))

export const productsRelations = relations(products, ({ one, many }) => ({
    creator: one(users, {
        fields: [products.creatorId],
        references: [users.id]
    }),
    productFiles: many(productFiles),
    productPreviewImages: many(productPreviewImages),
    cartItems: many(cartItems),
    productLikes: many(productLikes),
    orderItems: many(orderItems),
    userPurchases: many(userPurchases)
}))

export const productFilesRelations = relations(productFiles, ({ one }) => ({
    product: one(products, {
        fields: [productFiles.productId],
        references: [products.id]
    })
}))

export const productPreviewImagesRelations = relations(productPreviewImages, ({ one }) => ({
    product: one(products, {
        fields: [productPreviewImages.productId],
        references: [products.id]
    })
}))

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
    customer: one(users, {
        fields: [cartItems.customerId],
        references: [users.id]
    }),
    product: one(products, {
        fields: [cartItems.productId],
        references: [products.id]
    })
}))

export const productLikesRelations = relations(productLikes, ({ one }) => ({
    user: one(users, {
        fields: [productLikes.userId],
        references: [users.id]
    }),
    product: one(products, {
        fields: [productLikes.productId],
        references: [products.id]
    })
}))

export const ordersRelations = relations(orders, ({ one, many }) => ({
    customer: one(users, {
        fields: [orders.customerId],
        references: [users.id]
    }),
    orderItems: many(orderItems),
    payments: many(payments),
    userPurchases: many(userPurchases),
    creatorEarnings: many(creatorEarnings)
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
    order: one(orders, {
        fields: [orderItems.orderId],
        references: [orders.id]
    }),
    product: one(products, {
        fields: [orderItems.productId],
        references: [products.id]
    })
}))

export const paymentsRelations = relations(payments, ({ one }) => ({
    order: one(orders, {
        fields: [payments.orderId],
        references: [orders.id]
    })
}))

export const userPurchasesRelations = relations(userPurchases, ({ one }) => ({
    customer: one(users, {
        fields: [userPurchases.customerId],
        references: [users.id]
    }),
    product: one(products, {
        fields: [userPurchases.productId],
        references: [products.id]
    }),
    order: one(orders, {
        fields: [userPurchases.orderId],
        references: [orders.id]
    })
}))

export const creatorEarningsRelations = relations(creatorEarnings, ({ one }) => ({
    creator: one(users, {
        fields: [creatorEarnings.creatorId],
        references: [users.id]
    }),
    order: one(orders, {
        fields: [creatorEarnings.orderId],
        references: [orders.id]
    })
}))

export const creatorBalancesRelations = relations(creatorBalances, ({ one }) => ({
    creator: one(users, {
        fields: [creatorBalances.creatorId],
        references: [users.id]
    })
}))

export const withdrawalsRelations = relations(withdrawals, ({ one }) => ({
    user: one(users, {
        fields: [withdrawals.userId],
        references: [users.id]
    })
}))
