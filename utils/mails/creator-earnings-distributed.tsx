import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import * as React from 'react'

interface EarningsDistributedEmailProps {
    totalAmount: number
    distributedAt: Date
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(
        amount
    )
}

function formatDate(date: Date) {
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(
        date
    )
}

export function earningsDistributedTemplate(data: EarningsDistributedEmailProps) {
    return (
        <Html lang="id">
            <Head />
            <Preview>Dana kamu berhasil didistribusikan — Pickblue</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Text style={logo}>pickblue</Text>

                    <Heading style={heading}>Dana berhasil didistribusikan</Heading>

                    <Text style={body}>
                        Pendapatan dari produk kamu sudah ditambahkan ke saldo yang siap dicairkan.
                    </Text>

                    <Text style={amountLabel}>Jumlah yang diterima</Text>
                    <Text style={amountValue}>{formatCurrency(data.totalAmount)}</Text>

                    <Text style={meta}>
                        <span style={muted}>Distribusi pada</span> {formatDate(data.distributedAt)}
                    </Text>

                    <Text style={footer}>Jika kamu merasa ini bukan transaksi kamu, hubungi support kami.</Text>
                </Container>
            </Body>
        </Html>
    )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

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
    margin: '0 0 28px'
}

const amountLabel: React.CSSProperties = {
    fontSize: '12px',
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    margin: '0 0 4px'
}

const amountValue: React.CSSProperties = {
    fontSize: '36px',
    fontWeight: '700',
    color: '#000',
    margin: '0 0 24px'
}

const meta: React.CSSProperties = {
    fontSize: '13px',
    color: '#333',
    borderTop: '1px solid #eaeaea',
    padding: '12px 0',
    margin: '0 0 28px'
}

const muted: React.CSSProperties = {
    color: '#aaa',
    marginRight: '4px'
}

const footer: React.CSSProperties = {
    fontSize: '12px',
    color: '#bbb',
    margin: '0',
    lineHeight: '1.6'
}
