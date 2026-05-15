import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import * as React from 'react'

type VerificationEmailProps = {
    redirectUrl: string
}

export function emailVerificationTemplate({ redirectUrl }: VerificationEmailProps) {
    return (
        <Html lang="id">
            <Head />
            <Preview>Verifikasi email Pickblue kamu</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Text style={logo}>pickblue</Text>

                    <Heading style={heading}>Verifikasi email kamu</Heading>

                    <Text style={body}>
                        Klik tombol di bawah untuk memverifikasi alamat email dan melanjutkan pendaftaran. Link berlaku
                        selama <strong>15 menit</strong>.
                    </Text>

                    <Button href={redirectUrl} style={button}>
                        Daftar sekarang
                    </Button>

                    <Text style={muted}>Atau buka link ini di browser:</Text>
                    <code style={codeBlock}>{redirectUrl}</code>

                    <Text style={footer}>Jika kamu tidak merasa mendaftar, abaikan email ini.</Text>
                </Container>
            </Body>
        </Html>
    )
}

// Styles
const main: React.CSSProperties = {
    backgroundColor: '#ffffff',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
}

const container: React.CSSProperties = {
    maxWidth: '480px',
    margin: '0 auto',
    padding: '40px 32px'
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
    margin: '0 0 8px',
    lineHeight: '1.3'
}

const body: React.CSSProperties = {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#555',
    margin: '0 0 28px'
}

const button: React.CSSProperties = {
    backgroundColor: '#4F46E5',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500',
    padding: '11px 28px',
    borderRadius: '6px',
    textDecoration: 'none',
    display: 'inline-block'
}

const muted: React.CSSProperties = {
    fontSize: '12px',
    color: '#999',
    margin: '28px 0 4px'
}

const codeBlock: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    color: '#555',
    backgroundColor: '#f6f6f6',
    border: '1px solid #eee',
    borderRadius: '6px',
    padding: '10px 12px',
    wordBreak: 'break-all',
    fontFamily: "Menlo, Monaco, 'Courier New', monospace"
}

const footer: React.CSSProperties = {
    fontSize: '12px',
    color: '#bbb',
    margin: '24px 0 0',
    lineHeight: '1.6'
}
