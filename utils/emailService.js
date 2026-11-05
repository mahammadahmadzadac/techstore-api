import nodemailer from 'nodemailer';

/**
 * TechStore Email Göndərmə Servisi
 * Gmail SMTP və ya Ehtiyat (Console/Dev) rejimi
 */
export const sendOtpEmail = async (email, otp, ad = 'Dəyərli Müştəri') => {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    // 1. Əgər .env-də Gmail şifrəsi yoxdursa, test rejimində konsola yazırıq (Server heç vaxt çökmür!)
    if (!emailUser || !emailPass) {
        console.log(`\n======================================================`);
        console.log(`📨 [EMAIL TEST REJİMİ - .env-də EMAIL_USER/EMAIL_PASS yoxdur]`);
        console.log(`Alıcı: ${email} (${ad})`);
        console.log(`🔑 OTP Təsdiq Kodu: ${otp}`);
        console.log(`Etibarlılıq müddəti: 5 dəqiqə`);
        console.log(`======================================================\n`);
        return { success: true, isMock: true, otp };
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: emailUser,
                pass: emailPass
            }
        });

        const mailOptions = {
            from: `"TechStore Rəsmi Mağaza" <${emailUser}>`,
            to: email,
            subject: `TechStore - Birdəfəlik Təsdiq Kodunuz: ${otp}`,
            html: `
                <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 30px; background-color: #0b0f19; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b;">
                    <div style="text-align: center; margin-bottom: 25px;">
                        <h1 style="color: #6366f1; margin: 0; font-size: 26px; letter-spacing: -0.5px;">⚡ TechStore</h1>
                        <p style="color: #94a3b8; font-size: 13px; margin: 5px 0 0;">Rəsmi Elektronika və Texnologiya Mağazası</p>
                    </div>

                    <div style="background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 25px; text-align: center;">
                        <h2 style="font-size: 18px; margin-top: 0; color: #ffffff;">Email Təsdiqi</h2>
                        <p style="color: #94a3b8; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
                            Hörmətli <strong>${ad}</strong>, TechStore-da qeydiyyatınızı tamamlamaq üçün aşağıdakı birdəfəlik təhlükəsizlik kodunu daxil edin:
                        </p>

                        <div style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); color: #ffffff; font-size: 32px; font-weight: 800; letter-spacing: 6px; padding: 12px 30px; border-radius: 10px; margin: 15px 0; box-shadow: 0 4px 15px rgba(79, 70, 229, 0.4);">
                            ${otp}
                        </div>

                        <p style="color: #64748b; font-size: 12px; margin-top: 20px;">
                            ⏱️ Bu kod <strong>5 dəqiqə</strong> ərzində etibarlıdır.
                        </p>
                    </div>

                    <div style="text-align: center; margin-top: 25px; font-size: 12px; color: #64748b;">
                        <p style="margin: 0;">Bu sorğunu siz etməmisinizsə, zəhmət olmasa bu məktubu nəzərə almayın.</p>
                        <p style="margin: 5px 0 0;">© 2026 TechStore MMC. Bütün hüquqlar qorunur.</p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        return { success: true, isMock: false };
    } catch (error) {
        console.error("Nodemailer xətası:", error.message);
        // E-poçt göndərilməsində xəta olsa belə (məsələn, yanlış gmail şifrəsi), server çökməsin, kodu konsolda qeyd etsin
        console.log(`[Ehtiyat Kod] ${email} üçün OTP: ${otp}`);
        return { success: false, error: error.message, isMock: true, otp };
    }
};

