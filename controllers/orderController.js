import Order from "../models/orders.js";

// 1. Yeni Sifariş yaratmaq (Müştəri üçün)
export const createOrder = async (req, res) => {
    try {
        const { mehsullar, umumiQiymet } = req.body;
        // Əgər səbət boşdursa, sifariş vermək olmaz
        if (!mehsullar || mehsullar.length === 0) {
            return res.status(400).json({
                message: "Səbət boşdur. Məhsul əlavə edin."
            });
        }
        // Yeni sifariş obyekti yaradırıq (req.user.id biletindən avtomatik gəlir!)
        const order = new Order({
            user: req.user.id,
            mehsullar: mehsullar, //Frontend-dən gələn array-ə uyğun
            umumiQiymet: umumiQiymet //Frontend-dən gələn məbləğ

        });
        const yeniSfaris = await order.save();
        res.status(201).json({
            message: "Sifarişiniz uğurla qəbul edildi! 🎉", sifaris: yeniSfaris
        });

    } catch (error) {
        res.status(500).json({ message: "Xəta baş verdi", xeta: error.message });
    }

};
// 2. Müştərinin öz sifarişlərini görməsi
export const getMyOrders = async (req, res) => {
    try {
        // Yalnız bu biletin sahibinə aid sifarişləri tapırıq və 
        // məhsulun adını/qiymətini qoşuruq (.populate)
        const sifarisler = await Order.find({
            user: req.user.id
        })
            .populate('mehsullar.product', 'basliq qiymet');
        res.status(200).json(sifarisler);
    } catch (error) {
        res.status(500).json({
            message: "Xəta baş verdi", xeta: error.message
        })
    }
};

// 3. Bütün sifarişləri görmək (Yalnız Admin üçün)
export const getAllOrders = async (req, res) => {
    try {
        // Həm müştərinin adını/emailini, həm də məhsulun detallarını gətiririk
        const butunSifarisler = await Order.find()
            .populate('user', 'ad email')
            .populate('mehsullar.product', 'basliq qiymet');

        res.status(200).json(butunSifarisler);

    } catch (error) {
        res.status(500).json({ message: "Xəta baş verdi", xeta: error.message });
    }
};

// 4. Sifarişin statusunu yeniləmək (Yalnız Admin üçün)
export const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const sifaris = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!sifaris) {
            return res.status(404).json({ message: "Sifariş tapılmadı!" });
        }

        res.status(200).json({ message: "Sifariş statusu yeniləndi! ✅", sifaris });
    } catch (error) {
        res.status(500).json({ message: "Xəta baş verdi", xeta: error.message });
    }
};