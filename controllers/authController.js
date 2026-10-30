import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';


// User Qeydiyyat fumksiyasi
export const register = async (req, res) => {
    try {
        //1. Müştərinin (Front-end-in) göndərdiyi məlumatları alırıq
        const { ad, email, password } = req.body;
        // 2. Yoxlayırıq: Bu email bazada artıq varmı?
        const userExists = await User.findOne({ email });
        //Əgər user varsa error veririk
        if (userExists) {
            return res.status(400).json({ message: "Bu email artıq qeydiyyatdan keçib." });
        }

        // 3. Şifrəni sındırıla bilməsin deyə kriptolayırıq (bcrypt ilə)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        //4. Yeni istifadəçi yığırıq
        const newUser = new User({
            ad,
            email,
            password: hashedPassword
        });

        // 5. Onu MongoDB-yə yadda saxlayırıq
        await newUser.save();
        res.status(201).json({
            message: "Təbriklə , qeydiyyat tamamlandı"
        });

    } catch (error) {
        res.status(500).json({
            message: "Server xətası baş verdi", err: error.message
        });
    }
};

//Giriş hissəsi 
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        //1. Verilən e-mail bazada varmi
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "Belə bir istifadəçi tapılmadı." });

        //2. Şifrəni yoxluyaq 
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) return res.status(400).json({ message: "Şifrə yanlışdır" });

        // 3. Hər şey düzdürsə, adama "Bilet" (Token) veririk (1 günlük ömrü olur)
        const token = jwt.sign({ id: user.id, role: user.role },
            process.env.JWT_SECRET, { expiresIn: '1d' }
        );
        res.status(200).json({ mesaj: "Uğurla giriş etdiniz!", token, user });

    } catch (error) {
        res.status(500).json({ mesaj: "Server xətası", xeta: error.message });
    }
}