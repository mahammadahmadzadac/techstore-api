import Product from '../models/Product.js';

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
        // find() - bazadakı bütün məhsulları gətirir
        const mehsullar = await Product.find();
        res.status(200).json(mehsullar);
    } catch (error) {
        res.status(500).json({ message: "Xəta baş verdi", xeta: error.message });
    }
};

// 3. ID ile tek məhsul gətirmək 
export const getProductById = async (req, res) => {
    try {
        const mehsul = await Product.findById(req.params.id)
        if (!mehsul) return res.status(404).json({ message: "Məhsul tapılmadı!" });
        res.status(200).json(mehsul);
    } catch (error) {
        res.status(500).json({
            message: "Xəta baş verdi ",
            error: error.message
        });
    }
}

// 4. Mehsulu yenilemek
export const updateProduct = async (req, res) => {
    try {
        const mehsul = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!mehsul) return res.status(404).json({
            message: "Məhsul tapılmadı"
        });
        res.status(200).json({
            message: "Məhsul yeniləndi"
        });
    } catch (error) {
        res.status(500).json({
            message: "Xəta baş verdi",
            xeta: error.message
        });
    }
}

// 5. Mehsulu Silmek 
export const deleteProduct = async (req, res) => {
    try {
        const mehsul = await Product.findByIdAndDelete(req.params.id);
        if (!mehsul) return res.status(404).json({
            message: "Mehsul tapilmadi!"
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
}

