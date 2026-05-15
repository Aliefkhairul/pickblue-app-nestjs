import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import * as React from 'react'

type OrderItem = {
    productNameSnapshot: string
    productPriceSnapshot: number
    quantity: number
    subTotal: number
}

type OrderConfirmationEmailProps = {
    orderCode: string
    totalAmount: number
    createdAt: Date
    orderItems: OrderItem[]
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(
        amount
    )
}

function formatDate(date?: Date | null) {
    if (!date) return '-'
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(
        date
    )
}

export function orderConfirmationTemplate(data: OrderConfirmationEmailProps) {
    return (
        <Html lang="id">
            <Head />
            <Preview>Pesanan #{data.orderCode} berhasil — Pickblue</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Text style={logo}>pickblue</Text>

                    <Heading style={heading}>Pesanan berhasil</Heading>

                    <Text style={body}>Pembayaran kamu telah dikonfirmasi. Berikut ringkasan pesanan kamu.</Text>

                    <Text style={meta}>
                        <span style={muted}>Kode Pesanan</span> #{data.orderCode}
                        {'  ·  '}
                        <span style={muted}>Tanggal</span> {formatDate(data.createdAt)}
                    </Text>

                    {data.orderItems.map((item, i) => (
                        <Text key={i} style={itemRow}>
                            <span style={itemName}>{item.productNameSnapshot}</span>
                            <span style={itemRight}>{formatCurrency(item.subTotal)}</span>
                            <br />
                            <span style={muted}>
                                {formatCurrency(item.productPriceSnapshot)} × {item.quantity}
                            </span>
                        </Text>
                    ))}

                    <Text style={totalRow}>
                        Total
                        <span style={totalRight}>{formatCurrency(data.totalAmount)}</span>
                    </Text>

                    <Text style={footer}>Terima kasih sudah berbelanja di Pickblue!</Text>
                </Container>
            </Body>
        </Html>
    )
}

const main: React.CSSProperties = {
    backgroundColor: '#ffffff',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
}

const container: React.CSSProperties = {
    maxWidth: '480px',
    margin: '0 auto',
    padding: '40px 24px'
}

const logo: React.CSSProperties = {
    fontSize: '15px',
    fontWeight: '600',
    color: '#000',
    margin: '0 0 32px'
}

const heading: React.CSSProperties = {
    fontSize: '22px',
    fontWeight: '700',
    color: '#111',
    margin: '0 0 8px'
}

const body: React.CSSProperties = {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#555',
    margin: '0 0 24px'
}

const meta: React.CSSProperties = {
    fontSize: '13px',
    color: '#333',
    borderTop: '1px solid #eaeaea',
    borderBottom: '1px solid #eaeaea',
    padding: '12px 0',
    margin: '0 0 20px'
}

const itemRow: React.CSSProperties = {
    fontSize: '14px',
    color: '#333',
    borderBottom: '1px solid #f0f0f0',
    padding: '10px 0',
    margin: '0',
    position: 'relative' as const
}

const itemName: React.CSSProperties = {
    fontWeight: '600'
}

const itemRight: React.CSSProperties = {
    float: 'right' as const,
    fontWeight: '600'
}

const muted: React.CSSProperties = {
    fontSize: '12px',
    color: '#aaa'
}

const totalRow: React.CSSProperties = {
    fontSize: '15px',
    fontWeight: '700',
    color: '#111',
    borderTop: '2px solid #333',
    padding: '12px 0',
    margin: '0 0 20px'
}

const totalRight: React.CSSProperties = {
    float: 'right' as const,
    fontSize: '18px'
}

const footer: React.CSSProperties = {
    fontSize: '12px',
    color: '#bbb',
    margin: '24px 0 0',
    lineHeight: '1.6'
}
