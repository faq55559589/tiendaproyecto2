const nodemailer = require('nodemailer');

// Configuración del transporter de Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS  // Contraseña de aplicación de Gmail
    }
});

// Verificar conexión al iniciar
transporter.verify((error, success) => {
    if (error) {
        console.log('❌ Error configurando email:', error.message);
    } else {
        console.log('✅ Servicio de email configurado correctamente');
    }
});

// ==================== PLANTILLAS DE EMAIL ====================

// Email de bienvenida al registrarse
const sendWelcomeEmail = async (userEmail, firstName) => {
    // MOCK: Si no hay credenciales, loguear y retornar éxito
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('⚠️ MODO DEV: Simulación de Email de Bienvenida');
        console.log(`To: ${userEmail}`);
        console.log(`Subject: ¡Bienvenido a GolazoStore! 🎉`);
        return { success: true, messageId: 'mock-welcome-id' };
    }

    const mailOptions = {
        from: `"GolazoStore ⚽" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: '¡Bienvenido a GolazoStore! 🎉',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #dc3545; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0;">⚽ GolazoStore</h1>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #333;">¡Hola ${firstName}! 👋</h2>
                    
                    <p style="color: #666; font-size: 16px; line-height: 1.6;">
                        ¡Gracias por registrarte en <strong>GolazoStore</strong>! 
                        Ahora sos parte de la comunidad de verdaderos fanáticos del fútbol.
                    </p>
                    
                    <p style="color: #666; font-size: 16px; line-height: 1.6;">
                        En nuestra tienda vas a encontrar:
                    </p>
                    
                    <ul style="color: #666; font-size: 16px; line-height: 1.8;">
                        <li>🏆 Camisetas retro históricas</li>
                        <li>⭐ Camisetas de la temporada actual</li>
                        <li>🌍 Selecciones de todo el mundo</li>
                        <li>💯 Calidad premium garantizada</li>
                    </ul>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="http://localhost:5500/frontend/catalogo.html" 
                           style="background-color: #dc3545; color: white; padding: 15px 30px; 
                                  text-decoration: none; border-radius: 5px; font-weight: bold;
                                  display: inline-block;">
                            Ver Catálogo 🛒
                        </a>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    
                    <p style="color: #999; font-size: 12px; text-align: center;">
                        Si no creaste esta cuenta, podés ignorar este email.
                    </p>
                </div>
                
                <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
                    © 2025 GolazoStore - Todos los derechos reservados
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Email de bienvenida enviado a:', userEmail);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error enviando email de bienvenida:', error);
        // Fallback
        console.log('⚠️ FALLBACK DEV: Simulación de Bienvenida tras error');
        return { success: true, messageId: 'mock-fallback-welcome' };
    }
};

// Email para recuperar contraseña
const sendPasswordResetEmail = async (userEmail, firstName, resetToken) => {
    const resetLink = `http://localhost:5500/frontend/reset-password.html?token=${resetToken}`;

    // MOCK: Si no hay credenciales, loguear y retornar éxito
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('⚠️ MODO DEV: Simulación de Email de Recuperación');
        console.log(`To: ${userEmail}`);
        console.log(`Link: ${resetLink}`);
        return { success: true, messageId: 'mock-id' };
    }

    const mailOptions = {
        from: `"GolazoStore ⚽" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: 'Recuperar contraseña - GolazoStore 🔑',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #dc3545; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0;">⚽ GolazoStore</h1>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #333;">Hola ${firstName} 👋</h2>
                    
                    <p style="color: #666; font-size: 16px; line-height: 1.6;">
                        Recibimos una solicitud para restablecer tu contraseña. 
                        Si no fuiste vos, podés ignorar este email.
                    </p>
                    
                    <p style="color: #666; font-size: 16px; line-height: 1.6;">
                        Para crear una nueva contraseña, hacé click en el siguiente botón:
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" 
                           style="background-color: #dc3545; color: white; padding: 15px 30px; 
                                  text-decoration: none; border-radius: 5px; font-weight: bold;
                                  display: inline-block;">
                            Restablecer Contraseña 🔑
                        </a>
                    </div>
                    
                    <p style="color: #999; font-size: 14px; text-align: center;">
                        ⚠️ Este enlace expira en <strong>1 hora</strong>.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    
                    <p style="color: #999; font-size: 12px; text-align: center;">
                        Si no solicitaste restablecer tu contraseña, ignorá este email.
                        Tu cuenta sigue segura.
                    </p>
                </div>
                
                <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
                    © 2025 GolazoStore - Todos los derechos reservados
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Email de recuperación enviado a:', userEmail);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error enviando email de recuperación:', error);
        // Fallback para desarrollo: permitir que continúe aunque falle el email real
        console.log('⚠️ FALLBACK DEV: Simulación de Email de Recuperación tras error');
        console.log(`Link: ${resetLink}`);
        return { success: true, messageId: 'mock-fallback-id' };
    }
};

// Email de verificación de cuenta
const sendVerificationEmail = async (userEmail, firstName, token) => {
    const verificationLink = `http://localhost:5500/frontend/verificar-email.html?token=${token}`;

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('⚠️ MODO DEV: Simulación de Email de Verificación');
        console.log(`To: ${userEmail}`);
        console.log(`Link: ${verificationLink}`);
        return { success: true, messageId: 'mock-verification-id' };
    }

    const mailOptions = {
        from: `"GolazoStore ⚽" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: 'Verifica tu cuenta - GolazoStore ✅',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #dc3545; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0;">⚽ GolazoStore</h1>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #333;">¡Casi listo, ${firstName}! 👋</h2>
                    
                    <p style="color: #666; font-size: 16px; line-height: 1.6;">
                        Para completar tu registro y activar tu cuenta, por favor verifica tu correo electrónico.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationLink}" 
                           style="background-color: #dc3545; color: white; padding: 15px 30px; 
                                  text-decoration: none; border-radius: 5px; font-weight: bold;
                                  display: inline-block;">
                            Verificar mi Email ✅
                        </a>
                    </div>
                    
                    <p style="color: #999; font-size: 14px; text-align: center;">
                        O copia este enlace en tu navegador: <br>
                        <a href="${verificationLink}">${verificationLink}</a>
                    </p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('📧 Email de verificación enviado a:', userEmail);
        return { success: true };
    } catch (error) {
        console.error('❌ Error enviando email de verificación:', error);
        console.log('⚠️ FALLBACK DEV: Simulación de Verificación tras error');
        console.log(`Link: ${verificationLink}`);
        return { success: true, messageId: 'mock-fallback-verification' };
    }
};

// Email de confirmación de compra (para el futuro)
const sendOrderConfirmationEmail = async (userEmail, firstName, orderDetails) => {
    // TODO: Implementar cuando esté el checkout
    console.log('📧 Email de confirmación de orden (pendiente de implementar)');
};

module.exports = {
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendVerificationEmail,
    sendOrderConfirmationEmail
};
