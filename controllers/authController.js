import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendOtpEmail } from '../utils/emailService.js';

// 1. İstifadəçi Qeydiyyatı (OTP ilə Email Təsdiqi)
export const register = async (req, res) => {
    try {
        const { ad, email, password } = req.body;

        if (!ad || !email || !password) {
            return res.status(400).json({ message: "Zəhmət olmasa bütün xanaları doldurun!" });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // 2. Yoxlayırıq: Bu email bazada artıq varmı?
        let user = await User.findOne({ email: normalizedEmail });

        // Əgər istifadəçi artıq qeydiyyatdan keçib və təsdiqlənibsə
        if (user && (user.isVerified === true || user.isVerified === undefined)) {
            return res.status(400).json({ message: "Bu email artıq qeydiyyatdan keçib və təsdiqlənib." });
        }

        // Şifrəni kriptolayırıq
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 6 rəqəmli təhlükəsiz OTP kod yaradırıq (məs: 748192)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 dəqiqəlik ömür

        if (user && user.isVerified === false) {
            // Əgər əvvəl qeydiyyatdan keçib amma təsdiqləməyibsə, məlumatlarını və OTP-ni yeniləyirik
            user.ad = ad;
            user.password = hashedPassword;
            user.otpCode = otp;
            user.otpExpires = otpExpires;
            await user.save();
        } else {
            // Yeni istifadəçi sənədi yaradırıq
            user = new User({
                ad,
                email: normalizedEmail,
                password: hashedPassword,
                isVerified: false,
                otpCode: otp,
                otpExpires: otpExpires
            });
            await user.save();
        }

        // Emailə OTP göndəririk (və ya test rejimində konsola yazırıq)
        const emailResult = await sendOtpEmail(normalizedEmail, otp, ad);

        res.status(200).json({
            message: "Təsdiq kodu email ünvanınıza göndərildi! 📩",
            email: normalizedEmail,
            requiresOtp: true,
            isMock: emailResult.isMock,
            devOtp: emailResult.isMock ? otp : undefined
        });

    } catch (error) {
        res.status(500).json({
            message: "Server xətası baş verdi",
            err: error.message
        });
    }
};

// 2. OTP Kodunu Təsdiqləmək və Hesabı Aktivləşdirmək
export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "Email və OTP kod tələb olunur!" });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({ message: "İstifadəçi tapılmadı!" });
        }

        if (user.isVerified === true) {
            return res.status(400).json({ message: "Bu hesab artıq təsdiqlənib. Daxil ola bilərsiniz." });
        }

        // Vaxt yoxlanışı (5 dəqiqə keçibmi?)
        if (!user.otpExpires || new Date() > user.otpExpires) {
            return res.status(400).json({ message: "Təsdiq kodunun vaxtı bitib. Zəhmət olmasa yeni kod tələb edin." });
        }

        // Kod yoxlanışı
        if (user.otpCode !== otp.toString().trim()) {
            return res.status(400).json({ message: "Daxil edilən OTP kod yanlışdır!" });
        }

        // Hesabı təsdiqləyirik və istifadə olunmuş OTP-ni təmizləyirik
        user.isVerified = true;
        user.otpCode = undefined;
        user.otpExpires = undefined;
        await user.save();

        // Uğurlu giriş üçün JWT Token veririk
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        const userMelumat = {
            _id: user._id,
            ad: user.ad,
            email: user.email,
            role: user.role
        };

        res.status(200).json({
            message: "Emailiniz uğurla təsdiqləndi! Xoş gəldiniz 🎉",
            token,
            user: userMelumat
        });

    } catch (error) {
        res.status(500).json({ message: "Təsdiq zamanı xəta baş verdi", err: error.message });
    }
};

// 3. Təkrar OTP Kod Göndərmək (Resend OTP)
export const resendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email ünvanı tələb olunur!" });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({ message: "Bu email ilə qeydiyyat tapılmadı!" });
        }

        if (user.isVerified === true) {
            return res.status(400).json({ message: "Bu hesab artıq təsdiqlənib." });
        }

        // Yeni OTP yaradırıq
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otpCode = otp;
        user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
        await user.save();

        const emailResult = await sendOtpEmail(normalizedEmail, otp, user.ad);

        res.status(200).json({
            message: "Yeni təsdiq kodu emailinizə göndərildi! 📩",
            devOtp: emailResult.isMock ? otp : undefined
        });

    } catch (error) {
        res.status(500).json({ message: "Kod göndərilərkən xəta", err: error.message });
    }
};

// 4. Giriş (Login)
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email və şifrə daxil edilməlidir!" });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // 1. Verilən email bazada varmı?
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(404).json({ message: "Belə bir istifadəçi tapılmadı." });
        }

        // 2. Şifrəni yoxlayırıq
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Şifrə yanlışdır!" });
        }

        // 3. Email təsdiq yoxlanışı (Adminlər və əvvəlki qeydiyyatlar istisna olmaqla)
        if (user.isVerified === false && user.role !== 'admin') {
            // Əgər istifadəçi təsdiqlənməyibsə, dərhal yeni kod göndəririk və OTP ekranına yönləndiririk
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            user.otpCode = otp;
            user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
            await user.save();

            const emailResult = await sendOtpEmail(normalizedEmail, otp, user.ad);

            return res.status(403).json({
                message: "Emailiniz hələ təsdiqlənməyib. Yeni təsdiq kodu emailinizə göndərildi! 📩",
                requiresOtp: true,
                email: normalizedEmail,
                devOtp: emailResult.isMock ? otp : undefined
            });
        }

        // 4. Hər şey qaydasındadırsa, JWT Token veririk
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        const userMelumat = {
            _id: user._id,
            ad: user.ad,
            email: user.email,
            role: user.role
        };

        res.status(200).json({
            mesaj: "Uğurla giriş etdiniz!",
            token,
            user: userMelumat
        });

    } catch (error) {
        res.status(500).json({ mesaj: "Server xətası", xeta: error.message });
    }
};
