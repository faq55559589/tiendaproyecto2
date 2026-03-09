const nodemailer = require('nodemailer');

const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:8000/frontend').replace(/\/+$/, '');
const EMAIL_FROM = process.env.EMAIL_FROM || process.env.EMAIL_USER;
const EMAIL_REQUIRED = String(process.env.EMAIL_REQUIRED || 'false').toLowerCase() === 'true';
const GMAIL_EMAIL = (process.env.EMAIL_USER || '').trim();
const GMAIL_APP_PASSWORD = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');

function hasGmailConfig() {
    return Boolean(GMAIL_EMAIL && GMAIL_APP_PASSWORD);
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
            auth: {
                user: GMAIL_EMAIL,
                pass: GMAIL_APP_PASSWORD
            }
        });
    }

    return null;
}

const transporter = createTransporter();

if (transporter) {
    transporter.verify((error) => {
        if (error) {
            console.error('Error configurando email SMTP:', error.message);
        } else {
            console.log('Servicio de email configurado correctamente');
        }
    });
} else {
    console.warn('Email no configurado: define SMTP_* o EMAIL_USER/EMAIL_PASS');
}

async function sendMail({ to, subject, html }) {
    if (!transporter) {
        const message = 'Servicio de email no configurado';
        if (EMAIL_REQUIRED) {
            throw new Error(message);
        }
        console.warn(`${message}. Simulando envio a ${to}.`);
        return { success: true, mocked: true, messageId: 'mock-message-id' };
    }

    if (!EMAIL_FROM) {
        throw new Error('Falta EMAIL_FROM o EMAIL_USER en variables de entorno');
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

function renderEmailLayout({ title, intro, ctaLabel, ctaHref, note }) {
    return `
        <div style="margin:0;padding:0;background:#f3f4f6;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:24px 0;">
                <tr>
                    <td align="center">
                        <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
                            <tr>
                                <td style="background:linear-gradient(135deg,#b91c1c,#ef4444);padding:22px 28px;">
                                    <h1 style="margin:0;color:#ffffff;font-family:Arial,sans-serif;font-size:24px;letter-spacing:.4px;">GolazoStore</h1>
                                    <p style="margin:6px 0 0;color:#fee2e2;font-family:Arial,sans-serif;font-size:13px;">Tienda de camisetas de futbol</p>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:28px;font-family:Arial,sans-serif;color:#111827;">
                                    <h2 style="margin:0 0 12px;font-size:23px;line-height:1.3;">${title}</h2>
                                    <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#374151;">${intro}</p>
                                    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 16px;">
                                        <tr>
                                            <td style="border-radius:8px;background:#dc2626;">
                                                <a href="${ctaHref}" style="display:inline-block;padding:12px 18px;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;font-family:Arial,sans-serif;">${ctaLabel}</a>
                                            </td>
                                        </tr>
                                    </table>
                                    <p style="margin:0 0 6px;font-size:12px;color:#6b7280;">Si el boton no funciona, copia este enlace:</p>
                                    <p style="margin:0 0 18px;word-break:break-all;"><a href="${ctaHref}" style="font-size:12px;color:#b91c1c;">${ctaHref}</a></p>
                                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px;">
                                        <p style="margin:0;font-size:12px;line-height:1.6;color:#4b5563;">${note}</p>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:14px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;">
                                    <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#9ca3af;">Este email fue enviado por GolazoStore.</p>
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
    return sendMail({
        to: userEmail,
        subject: 'Bienvenido a GolazoStore',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2>Hola ${firstName || 'fan del futbol'}!</h2>
                <p>Tu cuenta ya esta verificada y lista para comprar.</p>
                <p><a href="${FRONTEND_URL}/catalogo.html">Ir al catalogo</a></p>
            </div>
        `
    });
};

const sendPasswordResetEmail = async (userEmail, firstName, resetToken) => {
    const resetLink = `${FRONTEND_URL}/reset-password.html?token=${encodeURIComponent(resetToken)}`;
    return sendMail({
        to: userEmail,
        subject: 'Recuperar contrasena - GolazoStore',
        html: renderEmailLayout({
            title: `Recuperar contrasena${firstName ? `, ${firstName}` : ''}`,
            intro: 'Recibimos una solicitud para restablecer tu contrasena. Si fuiste vos, continua con el boton de abajo.',
            ctaLabel: 'Restablecer contrasena',
            ctaHref: resetLink,
            note: 'Este enlace expira en 1 hora. Si no solicitaste este cambio, ignora este mensaje.'
        })
    });
};

const sendVerificationEmail = async (userEmail, firstName, token) => {
    const verificationLink = `${FRONTEND_URL}/verificar-email.html?token=${encodeURIComponent(token)}`;
    return sendMail({
        to: userEmail,
        subject: 'Verifica tu cuenta - GolazoStore',
        html: renderEmailLayout({
            title: `Verifica tu cuenta${firstName ? `, ${firstName}` : ''}`,
            intro: 'Tu cuenta ya fue creada. Falta un ultimo paso: confirmar tu email para activar el acceso.',
            ctaLabel: 'Verificar mi email',
            ctaHref: verificationLink,
            note: 'Si no creaste esta cuenta, puedes ignorar este correo con tranquilidad.'
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
