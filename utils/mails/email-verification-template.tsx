import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components'
import * as React from 'react'

interface VerificationEmailProps {
    redirectUrl: string
}

export function emailVerificationTemplate({ redirectUrl }: VerificationEmailProps) {
    return (
        <Html lang="id">
            <Head />
            <Preview>Lanjutkan pendaftaran akun Pickblue kamu</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header / Logo */}
                    <Section style={headerSection}>
                        <Text style={logoText}>pickblue</Text>
                    </Section>

                    {/* Title */}
                    <Heading style={heading}>Daftar Akun Pickblue</Heading>

                    <Text style={subHeading}>
                        Gunakan tombol di bawah untuk memverifikasi alamat email dan melanjutkan proses pendaftaran.
                    </Text>

                    <Hr style={divider} />

                    {/* Body Content */}
                    <Text style={bodyText}>
                        Kami menerima permintaan pendaftaran akun menggunakan alamat email ini. Untuk memastikan ini
                        memang kamu, silakan klik tombol berikut:
                    </Text>

                    {/* CTA Button */}
                    <Section style={ctaSection}>
                        <Button href={redirectUrl} style={button}>
                            Daftar
                        </Button>
                    </Section>

                    <Text style={bodyText}>Atau salin dan tempel link pendaftaran ini ke browser kamu:</Text>

                    {/* Fallback URL block */}
                    <code style={codeBlock}>{redirectUrl}</code>

                    {/* Warning & Info */}
                    <Text style={secondaryText}>
                        ⏱ Link pendaftaran ini hanya berlaku selama <strong style={highlight}>15 menit</strong>.
                    </Text>

                    <Text style={secondaryText}>
                        Jika kamu tidak merasa melakukan pendaftaran di Pickblue, kamu bisa mengabaikan email ini dengan
                        aman.
                    </Text>

                    <Hr style={divider} />

                    {/* Footer */}
                    <Text style={footerText}>
                        <strong style={{ color: '#333' }}>Pickblue</strong>, the all-in-one workspace for your business
                        automation.
                    </Text>
                </Container>
            </Body>
        </Html>
    )
}

// Styles
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

const secondaryText: React.CSSProperties = {
    fontSize: '14px',
    color: '#ababab',
    margin: '12px 0'
}

const highlight: React.CSSProperties = {
    color: '#37352f',
    fontWeight: '600'
}

const footerText: React.CSSProperties = {
    fontSize: '12px',
    lineHeight: '21px',
    color: '#898989',
    marginTop: '12px'
}
