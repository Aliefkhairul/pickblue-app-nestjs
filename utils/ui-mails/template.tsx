import { Body, Container, Head, Hr, Html, Link, Preview, Text, Button, Section } from '@react-email/components'
import * as React from 'react'

interface VerificationEmailProps {
    redirectUrl: string
}

export function emailVerificationTemplate({ redirectUrl }: VerificationEmailProps) {
    return (
        <Html lang="id">
            <Head />
            <Preview>Verifikasi akun Pickblue kamu — link berlaku 15 menit.</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Text style={logo}>pickblue</Text>
                    </Section>

                    {/* Title */}
                    <Section style={titleSection}>
                        <Text style={title}>Verifikasi Akun Kamu</Text>
                        <Text style={subtitle}>Satu langkah lagi untuk mulai menggunakan Pickblue.</Text>
                    </Section>

                    <Hr style={divider} />

                    {/* Body */}
                    <Text style={body}>
                        Terima kasih sudah mendaftar. Klik tombol di bawah untuk memverifikasi alamat email kamu. Link ini hanya berlaku selama <strong>15 menit</strong>.
                    </Text>

                    {/* CTA */}
                    <Section style={ctaSection}>
                        <Button href={redirectUrl} style={button}>
                            Verifikasi Akun Saya
                        </Button>
                    </Section>

                    <Hr style={divider} />

                    {/* Fallback link */}
                    <Section>
                        <Text style={fallbackLabel}>Jika tombol tidak berfungsi, salin link berikut ke browser:</Text>
                        <Link href={redirectUrl} style={fallbackLink}>
                            {redirectUrl}
                        </Link>
                    </Section>

                    {/* Warning */}
                    <Text style={warning}>
                        ⏱ Link ini akan kadaluarsa dalam <strong style={{ color: '#37352f' }}>15 menit</strong>.
                    </Text>

                    <Hr style={divider} />

                    {/* Footer */}
                    <Text style={footer}>Email ini dikirim secara otomatis oleh Pickblue. Jika kamu tidak merasa mendaftar, abaikan email ini.</Text>
                </Container>
            </Body>
        </Html>
    )
}

// Styles
const main: React.CSSProperties = {
    margin: '0',
    padding: '0',
    backgroundColor: '#ffffff',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif"
}

const container: React.CSSProperties = {
    maxWidth: '520px',
    margin: '0 auto',
    padding: '40px 24px'
}

const header: React.CSSProperties = {
    marginBottom: '32px'
}

const logo: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: '700',
    color: '#000',
    letterSpacing: '-0.5px',
    margin: '0'
}

const titleSection: React.CSSProperties = {
    marginBottom: '24px'
}

const title: React.CSSProperties = {
    fontSize: '26px',
    fontWeight: '700',
    color: '#000',
    marginBottom: '6px',
    lineHeight: '1.2',
    margin: '0 0 6px 0'
}

const subtitle: React.CSSProperties = {
    fontSize: '14px',
    color: '#787774',
    margin: '0'
}

const divider: React.CSSProperties = {
    border: 'none',
    borderTop: '1px solid #e9e9e7',
    margin: '0 0 24px'
}

const body: React.CSSProperties = {
    fontSize: '14px',
    color: '#37352f',
    lineHeight: '1.7',
    marginBottom: '28px'
}

const ctaSection: React.CSSProperties = {
    marginBottom: '28px'
}

const button: React.CSSProperties = {
    display: 'inline-block',
    padding: '8px 16px',
    backgroundColor: '#6B4FBB',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500',
    textDecoration: 'none',
    borderRadius: '4px'
}

const fallbackLabel: React.CSSProperties = {
    fontSize: '12px',
    color: '#787774',
    marginBottom: '6px'
}

const fallbackLink: React.CSSProperties = {
    fontSize: '12px',
    color: '#6B4FBB',
    wordBreak: 'break-all',
    fontFamily: 'monospace'
}

const warning: React.CSSProperties = {
    fontSize: '12px',
    color: '#787774',
    marginBottom: '40px'
}

const footer: React.CSSProperties = {
    fontSize: '12px',
    color: '#afafac',
    lineHeight: '1.6'
}
