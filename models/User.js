import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    ad: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    //Adam sadecə alıcıdır yoxsa admindir?
    role: { type: String, default: "user" },

    // Email Təsdiqi və OTP (Biznes və Təhlükəsizlik Məntiqi)
    isVerified: { type: Boolean, default: false },
    otpCode: { type: String },
    otpExpires: { type: Date }
}, { timestamps: true }); // timestamps data-nın nə vaxt yaradılıb və yenilənməsini bildirir



export default mongoose.model('User', userSchema);