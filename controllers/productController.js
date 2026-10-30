import Product from '../models/Product.js';
import { initialProducts } from '../seed.js';

// 1. Yeni məhsul əlavə etmək funksiyasi (Admin üçün)
export const createProduct = async (req, res) => {
    try {
        const yeniMehsul = new Product(req.body);
        await yeniMehsul.save();
        res.status(201).json({ message: "Məhsul uğurla əlavə edildi", mehsul: yeniMehsul });
    } catch (error) {
        res.status(500).json({ message: "Xəta baş verdi", xeta: error.message });
    }
};

// 2. Bütün məhsulları vitrində göstərmək (Müştərilər üçün)
export const getAllProducts = async (req, res) => {
    try {
        let mehsullar = await Product.find().sort({ createdAt: -1 });

        // Əgər baza boşdursa, avtomatik olaraq 10 premium məhsulu əlavə et
        if (mehsullar.length === 0 && initialProducts && initialProducts.length > 0) {
            await Product.insertMany(initialProducts);
            mehsullar = await Product.find().sort({ createdAt: -1 });
        }

        res.status(200).json(mehsullar);
    } catch (error) {
        res.status(500).json({ message: "Xəta baş verdi", xeta: error.message });
    }
};

// 3. Vitrini yenidən real məhsullarla doldurmaq (Seed API)
export const seedProducts = async (req, res) => {
    try {
        await Product.deleteMany({});
        const yeniSiyahi = await Product.insertMany(initialProducts);
        res.status(200).json({
            message: "Məhsullar uğurla yeniləndi və şəkillər əlavə edildi! 🎉",
            count: yeniSiyahi.length,
            mehsullar: yeniSiyahi
        });
    } catch (error) {
        res.status(500).json({ message: "Seed xətası", xeta: error.message });
    }
};

// 4. ID ilə tək məhsul gətirmək 
export const getProductById = async (req, res) => {
    try {
        const mehsul = await Product.findById(req.params.id);
        if (!mehsul) return res.status(404).json({ message: "Məhsul tapılmadı!" });
        res.status(200).json(mehsul);
    } catch (error) {
        res.status(500).json({
            message: "Xəta baş verdi",
            error: error.message
        });
    }
};

// 5. Məhsulu yeniləmək
export const updateProduct = async (req, res) => {
    try {
        const mehsul = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!mehsul) return res.status(404).json({
            message: "Məhsul tapılmadı"
        });
        res.status(200).json({
            message: "Məhsul yeniləndi",
            mehsul
        });
    } catch (error) {
        res.status(500).json({
            message: "Xəta baş verdi",
            xeta: error.message
        });
    }
};

// 6. Məhsulu silmək 
export const deleteProduct = async (req, res) => {
    try {
        const mehsul = await Product.findByIdAndDelete(req.params.id);
        if (!mehsul) return res.status(404).json({
            message: "Məhsul tapılmadı!"
        });
        res.status(200).json({
            message: "Məhsul uğurla silindi"
        });
    } catch (error) {
        res.status(500).json({
            message: "Xəta baş verdi",
            xeta: error.message
        });
    }
};
