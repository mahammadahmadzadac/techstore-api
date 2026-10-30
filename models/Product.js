import mongoose from "mongoose";
import User from "./User.js";

const productSchema = new mongoose.Schema({
    basliq: { type: String, required: true },
    tesvir: { type: String, required: true },
    qiymet: { type: Number, required: true },
    kategoriya: { type: String, required: true },
    // seklin linki
    sekilUrl: { type: String, required: false },
    satisSayi: { type: Number, default: 0 },
    //reyting
    reyting: { type: Number, default: 0, min: 0, max: 5 }, // 1-5 arası
    reySayi: { type: Number, default: 0 }, // rey cəmində
    reyler: [{
        ad: { type: String, required: true },
        reyting: { type: Number, min: 1, max: 5 },
        sherh: { type: String }
    }]
}, { timestamps: true });


export default mongoose.model('Product', productSchema);