import mongoose from "mongoose";

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
    reySayi: { type: Number, default: 0 } // rey cəmində
}, { timestamps: true });


export default mongoose.model('Product', productSchema);