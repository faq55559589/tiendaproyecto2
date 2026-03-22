const nodemailer = require('nodemailer');
const { getFrontendUrl, hasEmailProviderConfig } = require('../config/env');

const FRONTEND_URL = getFrontendUrl();
const EMAIL_FROM = process.env.EMAIL_FROM || process.env.EMAIL_USER;
const EMAIL_REQUIRED = String(process.env.EMAIL_REQUIRED || 'false').toLowerCase() === 'true';
const GMAIL_EMAIL = (process.env.EMAIL_USER || '').trim();
const GMAIL_APP_PASSWORD = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');
const BREVO_API_KEY = String(process.env.BREVO_API_KEY || '').trim();
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

function hasGmailConfig() {
    return Boolean(GMAIL_EMAIL && GMAIL_APP_PASSWORD);
}

function hasBrevoApiConfig() {
    return Boolean(BREVO_API_KEY);
}

function hasSmtpConfig() {
    return Boolean(
        process.env.SMTP_HOST &&
        process.env.SMTP_PORT &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
    );
}

function createTransporter() {
    if (hasSmtpConfig()) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
            family: 4,
            connectionTimeout: 5000,
            greetingTimeout: 5000,
            socketTimeout: 10000,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    if (hasGmailConfig()) {
        return nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            family: 4,
            connectionTimeout: 5000,
            greetingTimeout: 5000,
            socketTimeout: 10000,
            auth: {
                user: GMAIL_EMAIL,
                pass: GMAIL_APP_PASSWORD
            }
        });
    }

    return null;
}

const transporter = createTransporter();

if (hasBrevoApiConfig()) {
    console.log('Servicio de email configurado con Brevo API');
} else if (transporter) {
    transporter.verify((error) => {
        if (error) {
            console.error('Error configurando email SMTP:', error.message);
        } else {
            console.log('Servicio de email configurado correctamente');
        }
    });
} else {
    console.warn('Email no configurado: define BREVO_API_KEY o SMTP_* o EMAIL_USER/EMAIL_PASS');
}

if (EMAIL_REQUIRED && !hasEmailProviderConfig()) {
    throw new Error('EMAIL_REQUIRED=true pero no hay proveedor de email configurado');
}

async function sendWithBrevoApi({ to, subject, html }) {
    const response = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': BREVO_API_KEY,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            sender: {
                name: 'GolazoStore',
                email: EMAIL_FROM
            },
            to: [{ email: to }],
            subject,
            htmlContent: html
        })
    });

    const rawBody = await response.text();
    let data = null;

    try {
        data = rawBody ? JSON.parse(rawBody) : null;
    } catch {
        data = rawBody;
    }

    if (!response.ok) {
        const errorMessage = typeof data === 'object' && data !== null
            ? data.message || JSON.stringify(data)
            : rawBody || `HTTP ${response.status}`;
        throw new Error(`Brevo API error (${response.status}): ${errorMessage}`);
    }

    return {
        success: true,
        messageId: data && typeof data === 'object' ? data.messageId : undefined
    };
}

async function sendMail({ to, subject, html }) {
    if (!EMAIL_FROM) {
        throw new Error('Falta EMAIL_FROM o EMAIL_USER en variables de entorno');
    }

    if (hasBrevoApiConfig()) {
        try {
            return await sendWithBrevoApi({ to, subject, html });
        } catch (error) {
            if (EMAIL_REQUIRED) {
                throw error;
            }

            console.warn(`Fallo el envio de email por Brevo API a ${to}: ${error.message}. Continuando sin bloquear la operacion.`);
            return { success: true, mocked: true, messageId: 'brevo-api-send-failed-but-ignored' };
        }
    }

    if (!transporter) {
        const message = 'Servicio de email no configurado';
        if (EMAIL_REQUIRED) {
            throw new Error(message);
        }
        console.warn(`${message}. Simulando envio a ${to}.`);
        return { success: true, mocked: true, messageId: 'mock-message-id' };
    }

    try {
        const info = await transporter.sendMail({
            from: `"GolazoStore" <${EMAIL_FROM}>`,
            to,
            subject,
            html
        });

        return { success: true, messageId: info.messageId };
    } catch (error) {
        if (EMAIL_REQUIRED) {
            throw error;
        }

        console.warn(`Fallo el envio de email a ${to}: ${error.message}. Continuando sin bloquear la operacion.`);
        return { success: true, mocked: true, messageId: 'email-send-failed-but-ignored' };
    }
}

function renderEmailLayout({ eyebrow, title, intro, ctaLabel, ctaHref, note, outro, preheader }) {
    return `
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">
            ${preheader || title}
        </div>
        <div style="margin:0;padding:0;background:#f4f1ea;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f1ea;padding:24px 12px;">
                <tr>
                    <td align="center">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fffdfa;border-radius:18px;overflow:hidden;border:1px solid #eadfce;">
                            <tr>
                                <td style="background:#8a1c1c;padding:24px 28px 18px;">
                                    <p style="margin:0 0 8px;color:#f5d7ba;font-family:Arial,sans-serif;font-size:12px;letter-spacing:1.2px;text-transform:uppercase;">GolazoStore</p>
                                    <h1 style="margin:0;color:#ffffff;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.2;">Tienda de camisetas de futbol</h1>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:32px 28px 18px;font-family:Arial,sans-serif;color:#1f2937;">
                                    ${eyebrow ? `<p style="margin:0 0 10px;color:#8a1c1c;font-size:12px;letter-spacing:1px;text-transform:uppercase;font-weight:700;">${eyebrow}</p>` : ''}
                                    <h2 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.25;color:#111111;">${title}</h2>
                                    <p style="margin:0 0 22px;font-size:15px;line-height:1.75;color:#4b5563;">${intro}</p>
                                    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 16px;">
                                        <tr>
                                            <td style="border-radius:999px;background:#c2410c;">
                                                <a href="${ctaHref}" style="display:inline-block;padding:14px 22px;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;font-family:Arial,sans-serif;">${ctaLabel}</a>
                                            </td>
                                        </tr>
                                    </table>
                                    ${outro ? `<p style="margin:0 0 22px;font-size:14px;line-height:1.7;color:#4b5563;">${outro}</p>` : ''}
                                    <div style="background:#f8f1e7;border:1px solid #eadfce;border-radius:12px;padding:14px 16px;margin:0 0 18px;">
                                        <p style="margin:0;font-size:12px;line-height:1.7;color:#5b4636;">${note}</p>
                                    </div>
                                    <p style="margin:0 0 6px;font-size:12px;color:#6b7280;">Si el boton no funciona, copia este enlace:</p>
                                    <p style="margin:0;word-break:break-all;"><a href="${ctaHref}" style="font-size:12px;color:#8a1c1c;text-decoration:none;">${ctaHref}</a></p>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:16px 28px 24px;background:#fffdfa;border-top:1px solid #eadfce;">
                                    <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;line-height:1.6;color:#8b7d6b;">Este email fue enviado por GolazoStore. Si no esperabas este mensaje, puedes ignorarlo.</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </div>
    `;
}

const sendWelcomeEmail = async (userEmail, firstName) => {
    const catalogLink = `${FRONTEND_URL}/catalogo.html`;
    return sendMail({
        to: userEmail,
        subject: 'Bienvenido a GolazoStore',
        html: renderEmailLayout({
            eyebrow: 'Cuenta activada',
            title: `Bienvenido${firstName ? `, ${firstName}` : ''}`,
            intro: 'Tu cuenta ya esta verificada y lista para entrar, mirar el catalogo y avanzar con tu compra sin pasos extra.',
            ctaLabel: 'Ir al catalogo',
            ctaHref: catalogLink,
            outro: 'Si estabas terminando un registro o una compra, ya puedes volver a la tienda y seguir desde ahi.',
            note: 'Te recomendamos iniciar sesion con el mismo email con el que creaste la cuenta para ver tus pedidos y completar el checkout mas rapido.',
            preheader: 'Tu cuenta ya esta activa y lista para comprar.'
        })
    });
};

const sendPasswordResetEmail = async (userEmail, firstName, resetToken) => {
    const resetLink = `${FRONTEND_URL}/reset-password.html?token=${encodeURIComponent(resetToken)}`;
    return sendMail({
        to: userEmail,
        subject: 'Recuperar contrasena - GolazoStore',
        html: renderEmailLayout({
            eyebrow: 'Recuperacion de acceso',
            title: `Recuperar contrasena${firstName ? `, ${firstName}` : ''}`,
            intro: 'Recibimos una solicitud para restablecer tu contrasena. Si fuiste vos, continua con el boton de abajo.',
            ctaLabel: 'Restablecer contrasena',
            ctaHref: resetLink,
            outro: 'Por seguridad, usa este enlace solo desde un dispositivo de confianza.',
            note: 'Este enlace expira en 1 hora. Si no solicitaste este cambio, ignora este mensaje.',
            preheader: 'Usa este enlace para restablecer tu contrasena.'
        })
    });
};

const sendVerificationEmail = async (userEmail, firstName, token) => {
    const verificationLink = `${FRONTEND_URL}/verificar-email.html?token=${encodeURIComponent(token)}`;
    return sendMail({
        to: userEmail,
        subject: 'Verifica tu cuenta - GolazoStore',
        html: renderEmailLayout({
            eyebrow: 'Verificacion pendiente',
            title: `Verifica tu cuenta${firstName ? `, ${firstName}` : ''}`,
            intro: 'Tu cuenta ya fue creada. Falta un ultimo paso: confirmar tu email para activar el acceso.',
            ctaLabel: 'Verificar mi email',
            ctaHref: verificationLink,
            outro: 'Una vez confirmada la direccion, vas a poder iniciar sesion y usar la tienda normalmente.',
            note: 'Si no creaste esta cuenta, puedes ignorar este correo con tranquilidad.',
            preheader: 'Confirma tu email para activar tu cuenta.'
        })
    });
};

const sendOrderConfirmationEmail = async () => {
    return { success: true };
};

module.exports = {
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendVerificationEmail,
    sendOrderConfirmationEmail
};
