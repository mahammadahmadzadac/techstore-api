import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    ad: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    //Adam sadecə alıcıdır yoxsa admindir?
    role: { type: String, default: "user" }
}, { timestamps: true }); // timestamps data-nın nə vaxt yaradılıb və yenilənməsini bildirir



export default mongoose.model('User', userSchema);