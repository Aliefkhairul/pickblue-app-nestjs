import { Body, Column, Container, Head, Heading, Hr, Html, Row, Section, Text } from '@react-email/components'
import * as React from 'react'

interface EarningsDistributedEmailProps {
    totalAmount: number
    distributedAt: Date
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

export function earningsDistributedTemplate(data: EarningsDistributedEmailProps) {
    return (
        <Html lang="id">
            <Head />
            <Body style={main}>
                <Container style={container}>
                    <Section style={headerSection}>
                        <Text style={logoText}>pickblue</Text>
                    </Section>

                    <Heading style={heading}>Dana berhasil didistribusikan</Heading>
                    <Text style={subHeading}>
                        Pendapatan dari produk kamu sudah ditambahkan ke saldo yang siap dicairkan.
                    </Text>

                    <Hr style={divider} />

                    <Text style={amountLabel}>Jumlah yang diterima</Text>
                    <Text style={amountValue}>{formatCurrency(data.totalAmount)}</Text>

                    <Hr style={divider} />

                    <Section style={metaBox}>
                        <Row style={{ marginBottom: '10px' }}>
                            <Column style={metaKeyCol}>
                                <Text style={keyText}>Kode pesanan</Text>
                            </Column>
                        </Row>
                        <Row>
                            <Column style={metaKeyCol}>
                                <Text style={keyText}>Distribusi pada</Text>
                            </Column>
                            <Column>
                                <Text style={valText}>{formatDate(data.distributedAt.toISOString())}</Text>
                            </Column>
                        </Row>
                    </Section>

                    <Hr style={divider} />

                    <Text style={footerText}>
                        <strong style={{ color: '#555' }}>Pickblue</strong> — Digital marketplace untuk kreator dan
                        bisnis modern.
                    </Text>
                    <Text style={{ ...footerText, marginTop: '4px' }}>
                        Jika kamu merasa ini bukan transaksi kamu, hubungi support kami.
                    </Text>
                </Container>
            </Body>
        </Html>
    )
}

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

const amountLabel: React.CSSProperties = {
    fontSize: '12px',
    color: '#ababab',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    margin: '0 0 8px 0'
}

const amountValue: React.CSSProperties = {
    fontSize: '36px',
    fontWeight: '700',
    color: '#000',
    margin: '0 0 24px 0'
}

const metaBox: React.CSSProperties = {
    backgroundColor: '#f9f9f9',
    borderRadius: '6px',
    border: '1px solid #eaeaea',
    padding: '16px 20px'
}

const metaKeyCol: React.CSSProperties = {
    width: '150px'
}

const keyText: React.CSSProperties = {
    fontSize: '13px',
    color: '#ababab',
    margin: '0'
}

const valText: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: '600',
    color: '#333',
    margin: '0'
}

const footerText: React.CSSProperties = {
    fontSize: '12px',
    lineHeight: '21px',
    color: '#898989',
    marginTop: '12px'
}
