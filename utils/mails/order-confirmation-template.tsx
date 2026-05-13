import { Body, Button, Column, Container, Head, Heading, Hr, Html, Preview, Row, Section, Text } from '@react-email/components'
import * as React from 'react'

interface OrderItem {
    id: string
    productId: string | null
    quantity: number
    productNameSnapshot: string
    productDescriptionSnapshot: string
    productDetailsSnapshot: string | null
    productPriceSnapshot: number
    subTotal: number
}

interface PaymentDetails {
    paymentId?: string
    externalId?: string | null
    paymentUrl?: string | null
    status?: string | null
    provider?: string
    expiresAt?: Date | null
}

interface OrderConfirmationEmailProps {
    id: string
    customerId: string
    orderCode: string
    totalAmount: number
    status: string
    paidAt: Date | null
    createdAt: Date
    updatedAt: Date
    orderItems: OrderItem[]
    paymentDetails: PaymentDetails
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount)
}

function formatDate(dateStr?: string): string {
    if (!dateStr) return '-'
    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'long',
        timeStyle: 'short',
        timeZone: 'Asia/Jakarta'
    }).format(new Date(dateStr))
}

function getStatusLabel(status: string): string {
    const map: Record<string, string> = {
        pending: 'Menunggu Pembayaran',
        paid: 'Lunas',
        cancelled: 'Dibatalkan',
        expired: 'Kadaluarsa'
    }
    return map[status?.toLowerCase()] ?? status
}

function getStatusStyle(status: string): React.CSSProperties {
    const s = status?.toLowerCase()
    if (s === 'paid') return { color: '#15803d', fontWeight: '700' }
    if (s === 'pending') return { color: '#b45309', fontWeight: '700' }
    if (s === 'cancelled' || s === 'expired') return { color: '#b91c1c', fontWeight: '700' }
    return {}
}

export function orderConfirmationTemplate(data: OrderConfirmationEmailProps) {
    const isPending = data.paymentDetails?.status?.toLowerCase() === 'pending'
    const isPaid = data.status?.toLowerCase() === 'paid'

    return (
        <Html lang="id">
            <Head />
            <Preview>Pesanan #{data.orderCode} telah diterima — Pickblue</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header / Logo */}
                    <Section style={headerSection}>
                        <Text style={logoText}>pickblue</Text>
                    </Section>

                    {/* Title */}
                    <Heading style={heading}>{isPaid ? '✅ Pesanan Dikonfirmasi' : '🧾 Pesanan Diterima'}</Heading>

                    <Text style={subHeading}>
                        {isPaid
                            ? 'Pembayaran kamu berhasil. Berikut detail pesanan kamu.'
                            : 'Kami telah menerima pesanan kamu. Selesaikan pembayaran sebelum batas waktu.'}
                    </Text>

                    <Hr style={divider} />

                    {/* Order Meta */}
                    <Section>
                        <Row>
                            <Column style={metaColumn}>
                                <Text style={metaLabel}>Kode Pesanan</Text>
                                <Text style={metaValue}>#{data.orderCode}</Text>
                            </Column>
                            <Column style={metaColumn}>
                                <Text style={metaLabel}>Status</Text>
                                <Text style={{ ...metaValue, ...getStatusStyle(data.status) }}>{getStatusLabel(data.status)}</Text>
                            </Column>
                            <Column style={metaColumn}>
                                <Text style={metaLabel}>Tanggal</Text>
                                <Text style={metaValue}>{formatDate(data.createdAt.toDateString())}</Text>
                            </Column>
                        </Row>
                    </Section>

                    <Hr style={divider} />

                    {/* Order Items */}
                    <Text style={sectionTitle}>Item Pesanan</Text>

                    {data.orderItems.map((item, index) => (
                        <Section key={item.id} style={index % 2 === 0 ? itemRowEven : itemRowOdd}>
                            <Row>
                                <Column style={{ flex: 1 }}>
                                    <Text style={itemName}>{item.productNameSnapshot}</Text>
                                    {item.productDescriptionSnapshot && <Text style={itemDesc}>{item.productDescriptionSnapshot}</Text>}
                                    <Text style={itemMeta}>
                                        {formatCurrency(item.productPriceSnapshot)} × {item.quantity}
                                    </Text>
                                </Column>
                                <Column style={itemSubtotalCol}>
                                    <Text style={itemSubtotal}>{formatCurrency(item.subTotal)}</Text>
                                </Column>
                            </Row>
                        </Section>
                    ))}

                    {/* Total */}
                    <Section style={totalSection}>
                        <Row>
                            <Column style={{ flex: 1 }}>
                                <Text style={totalLabel}>Total Pembayaran</Text>
                            </Column>
                            <Column>
                                <Text style={totalValue}>{formatCurrency(data.totalAmount)}</Text>
                            </Column>
                        </Row>
                    </Section>

                    <Hr style={divider} />

                    {/* Payment Info */}
                    <Text style={sectionTitle}>Info Pembayaran</Text>

                    <Section style={paymentInfoBox}>
                        <Row style={{ marginBottom: '8px' }}>
                            <Column style={payInfoLabel}>
                                <Text style={payKey}>Provider</Text>
                            </Column>
                            <Column>
                                <Text style={payVal}>{data.paymentDetails?.provider ?? '-'}</Text>
                            </Column>
                        </Row>
                        <Row style={{ marginBottom: '8px' }}>
                            <Column style={payInfoLabel}>
                                <Text style={payKey}>Status Pembayaran</Text>
                            </Column>
                            <Column>
                                <Text style={payVal}>{getStatusLabel(data.paymentDetails?.status ?? '-')}</Text>
                            </Column>
                        </Row>
                        {data.paymentDetails?.expiresAt && (
                            <Row style={{ marginBottom: '8px' }}>
                                <Column style={payInfoLabel}>
                                    <Text style={payKey}>Batas Waktu</Text>
                                </Column>
                                <Column>
                                    <Text style={{ ...payVal, color: '#e53e3e', fontWeight: '600' }}>{formatDate(data.paymentDetails.expiresAt.toDateString())}</Text>
                                </Column>
                            </Row>
                        )}
                        {data.paidAt && (
                            <Row>
                                <Column style={payInfoLabel}>
                                    <Text style={payKey}>Dibayar Pada</Text>
                                </Column>
                                <Column>
                                    <Text style={payVal}>{formatDate(data.paidAt.toDateString())}</Text>
                                </Column>
                            </Row>
                        )}
                    </Section>

                    {/* CTA — only show if pending */}
                    {isPending && data.paymentDetails?.paymentUrl && (
                        <Section style={ctaSection}>
                            <Text style={bodyText}>Selesaikan pembayaran kamu sekarang:</Text>
                            <Button href={data.paymentDetails.paymentUrl} style={button}>
                                Bayar Sekarang
                            </Button>
                            <Text style={bodyText}>Atau salin link berikut ke browser kamu:</Text>
                            <code style={codeBlock}>{data.paymentDetails.paymentUrl}</code>
                        </Section>
                    )}

                    <Hr style={divider} />

                    {/* Footer */}
                    <Text style={footerText}>
                        <strong style={{ color: '#333' }}>Pickblue</strong> — Digital marketplace untuk kreator dan bisnis modern.
                    </Text>
                    <Text style={{ ...footerText, marginTop: '4px' }}>Jika kamu tidak merasa melakukan pesanan ini, abaikan email ini atau hubungi support kami.</Text>
                </Container>
            </Body>
        </Html>
    )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const main: React.CSSProperties = {
    backgroundColor: '#ffffff',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    margin: '0 auto'
}

const container: React.CSSProperties = {
    maxWidth: '560px',
    margin: '0 auto',
    padding: '40px 20px'
}

const headerSection: React.CSSProperties = {
    marginBottom: '32px'
}

const logoText: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: '700',
    color: '#000',
    letterSpacing: '-0.5px',
    margin: '0'
}

const heading: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: '700',
    color: '#333',
    lineHeight: '1.2',
    margin: '30px 0 8px 0'
}

const subHeading: React.CSSProperties = {
    fontSize: '14px',
    color: '#787774',
    margin: '0 0 24px 0'
}

const divider: React.CSSProperties = {
    border: 'none',
    borderTop: '1px solid #eaeaea',
    margin: '26px 0',
    width: '100%'
}

const sectionTitle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: '600',
    color: '#787774',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: '0 0 12px 0'
}

const metaColumn: React.CSSProperties = {
    paddingRight: '16px'
}

const metaLabel: React.CSSProperties = {
    fontSize: '12px',
    color: '#ababab',
    margin: '0 0 2px 0'
}

const metaValue: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    margin: '0'
}

const itemRowEven: React.CSSProperties = {
    padding: '12px 0',
    borderBottom: '1px solid #f4f4f4'
}

const itemRowOdd: React.CSSProperties = {
    padding: '12px 0',
    borderBottom: '1px solid #f4f4f4',
    backgroundColor: '#fafafa'
}

const itemName: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    margin: '0 0 2px 0'
}

const itemDesc: React.CSSProperties = {
    fontSize: '12px',
    color: '#ababab',
    margin: '0 0 4px 0'
}

const itemMeta: React.CSSProperties = {
    fontSize: '12px',
    color: '#787774',
    margin: '0'
}

const itemSubtotalCol: React.CSSProperties = {
    textAlign: 'right' as const,
    verticalAlign: 'top'
}

const itemSubtotal: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    margin: '0'
}

const totalSection: React.CSSProperties = {
    padding: '14px 0',
    borderTop: '2px solid #333',
    marginTop: '4px'
}

const totalLabel: React.CSSProperties = {
    fontSize: '15px',
    fontWeight: '700',
    color: '#333',
    margin: '0'
}

const totalValue: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: '700',
    color: '#000',
    margin: '0',
    textAlign: 'right' as const
}

const paymentInfoBox: React.CSSProperties = {
    backgroundColor: '#f9f9f9',
    borderRadius: '6px',
    border: '1px solid #eaeaea',
    padding: '16px',
    marginBottom: '16px'
}

const payInfoLabel: React.CSSProperties = {
    width: '150px'
}

const payKey: React.CSSProperties = {
    fontSize: '13px',
    color: '#ababab',
    margin: '0'
}

const payVal: React.CSSProperties = {
    fontSize: '13px',
    color: '#333',
    fontWeight: '500',
    margin: '0'
}

const bodyText: React.CSSProperties = {
    fontSize: '14px',
    lineHeight: '24px',
    color: '#333',
    margin: '16px 0'
}

const ctaSection: React.CSSProperties = {
    margin: '32px 0'
}

const button: React.CSSProperties = {
    backgroundColor: '#00A3FF',
    borderRadius: '5px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '12px 34px',
    lineHeight: '100%'
}

const codeBlock: React.CSSProperties = {
    display: 'inline-block',
    padding: '12px 16px',
    width: '94%',
    backgroundColor: '#f4f4f4',
    borderRadius: '6px',
    border: '1px solid #eee',
    color: '#333',
    fontSize: '12px',
    fontFamily: "Menlo, Monaco, Consolas, 'Courier New', monospace",
    wordBreak: 'break-all'
}

const footerText: React.CSSProperties = {
    fontSize: '12px',
    lineHeight: '21px',
    color: '#898989',
    marginTop: '12px'
}
