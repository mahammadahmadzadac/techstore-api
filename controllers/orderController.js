import Order from "../models/orders.js";
import Product from "../models/Product.js";

// 1. Yeni Sifariş yaratmaq (Müştəri üçün - Biznes Məntiqi ilə)
export const createOrder = async (req, res) => {
    try {
        const { mehsullar, unvan, telefon, kuryerQeydi, odenisNovu } = req.body;

        // Əgər səbət boşdursa, sifariş vermək olmaz
        if (!mehsullar || !Array.isArray(mehsullar) || mehsullar.length === 0) {
            return res.status(400).json({
                message: "Səbət boşdur. Məhsul əlavə edin."
            });
        }

        // Biznes Məntiqi: Çatdırılma ünvanı və telefon nömrəsi mütləq olmalıdır
        if (!unvan || !unvan.trim()) {
            return res.status(400).json({
                message: "Zəhmət olmasa çatdırılma ünvanını daxil edin!"
            });
        }
        if (!telefon || !telefon.trim()) {
            return res.status(400).json({
                message: "Zəhmət olmasa əlaqə telefon nömrəsini daxil edin!"
            });
        }

        // Təhlükəsizlik və Stok Yoxlanışı:
        // Hər bir məhsulun anbardakı real stokunu yoxlayırıq və qiymətini bazadan götürürük
        let umumiHesablanmisQiymet = 0;
        const tesdiqlenmisMehsullar = [];
        const yenilenecekMehsullar = [];

        for (const item of mehsullar) {
            const mehsulBazada = await Product.findById(item.product);
            if (!mehsulBazada) {
                return res.status(404).json({
                    message: `ID-si ${item.product} olan məhsul tapılmadı!`
                });
            }

            const mehsulSayi = Number(item.say) > 0 ? Number(item.say) : 1;
            const movcudStok = mehsulBazada.stokSayi !== undefined ? mehsulBazada.stokSayi : 10;

            // 1. Biznes Məntiqi: Stok Yoxlanışı
            if (movcudStok < mehsulSayi) {
                return res.status(400).json({
                    message: `"${mehsulBazada.basliq}" üçün anbarda kifayət qədər stok yoxdur! Qalan stok: ${movcudStok} ədəd.`
                });
            }

            const mehsulQiymet = Number(mehsulBazada.qiymet);
            umumiHesablanmisQiymet += mehsulQiymet * mehsulSayi;

            tesdiqlenmisMehsullar.push({
                product: mehsulBazada._id,
                say: mehsulSayi,
                qiymet: mehsulQiymet
            });

            // Anbardan çıxarılacaq siyahıya əlavə edirik
            yenilenecekMehsullar.push({
                doc: mehsulBazada,
                cixilacaqSay: mehsulSayi
            });
        }

        // Bütün yoxlamalar uğurludursa, anbardakı stoku azaldırıq və satış sayını artırırıq
        for (const { doc, cixilacaqSay } of yenilenecekMehsullar) {
            doc.stokSayi = Math.max(0, (doc.stokSayi !== undefined ? doc.stokSayi : 10) - cixilacaqSay);
            doc.satisSayi = (doc.satisSayi || 0) + cixilacaqSay;
            await doc.save();
        }

        // Yeni sifariş obyekti yaradırıq (req.user.id biletindən avtomatik gəlir!)
        const order = new Order({
            user: req.user.id,
            mehsullar: tesdiqlenmisMehsullar,
            umumiQiymet: umumiHesablanmisQiymet,
            unvan: unvan.trim(),
            telefon: telefon.trim(),
            kuryerQeydi: kuryerQeydi ? kuryerQeydi.trim() : '',
            odenisNovu: odenisNovu || 'Qapıda Nağd'
        });

        const yeniSfaris = await order.save();
        res.status(201).json({
            message: "Sifarişiniz uğurla qəbul edildi! Kuryer tezliklə sizinlə əlaqə saxlayacaq. 🎉📦",
            sifaris: yeniSfaris
        });

    } catch (error) {
        res.status(500).json({ message: "Xəta baş verdi", xeta: error.message });
    }
};

// 2. Müştərinin öz sifarişlərini görməsi
export const getMyOrders = async (req, res) => {
    try {
        const sifarisler = await Order.find({
            user: req.user.id
        })
            .populate('mehsullar.product', 'basliq qiymet sekilUrl')
            .sort({ createdAt: -1 });

        res.status(200).json(sifarisler);
    } catch (error) {
        res.status(500).json({
            message: "Xəta baş verdi", xeta: error.message
        });
    }
};

// 3. Bütün sifarişləri görmək (Yalnız Admin üçün)
export const getAllOrders = async (req, res) => {
    try {
        const butunSifarisler = await Order.find()
            .populate('user', 'ad email')
            .populate('mehsullar.product', 'basliq qiymet sekilUrl')
            .sort({ createdAt: -1 });

        res.status(200).json(butunSifarisler);

    } catch (error) {
        res.status(500).json({ message: "Xəta baş verdi", xeta: error.message });
    }
};

// 4. Sifarişin statusunu yeniləmək (Yalnız Admin üçün)
export const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const sifaris = await Order.findById(req.params.id);

        if (!sifaris) {
            return res.status(404).json({ message: "Sifariş tapılmadı!" });
        }

        const evvelkiStatus = sifaris.status;
        sifaris.status = status;
        await sifaris.save();

        // Əgər admin sifarişi "Ləğv edildi" edirsə və əvvəl ləğv edilməmişdisə, stoku geri qaytarırıq
        if (status === 'Ləğv edildi' && evvelkiStatus !== 'Ləğv edildi') {
            for (const item of sifaris.mehsullar) {
                const productDoc = await Product.findById(item.product);
                if (productDoc) {
                    productDoc.stokSayi = (productDoc.stokSayi || 0) + item.say;
                    productDoc.satisSayi = Math.max(0, (productDoc.satisSayi || 0) - item.say);
                    await productDoc.save();
                }
            }
        }

        res.status(200).json({ message: "Sifariş statusu yeniləndi! ✅", sifaris });
    } catch (error) {
        res.status(500).json({ message: "Xəta baş verdi", xeta: error.message });
    }
};

// 5. Sifarişi Ləğv Etmək (Müştərinin özü üçün - Stokun Avtomatik Bərpası ilə)
export const cancelOrder = async (req, res) => {
    try {
        const sifaris = await Order.findById(req.params.id);
        if (!sifaris) {
            return res.status(404).json({ message: "Sifariş tapılmadı!" });
        }

        // Təhlükəsizlik: Yalnız bu sifarişi verən müştəri və ya Admin ləğv edə bilər
        if (sifaris.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Bu sifarişi ləğv etmək hüququnuz yoxdur!" });
        }

        // Biznes Qaydası: Əgər sifariş artıq kuryerdədirsə ("Çatdırılır") və ya "Tamamlandı"dırsa, ləğv edilə bilməz
        if (sifaris.status === 'Ləğv edildi') {
            return res.status(400).json({ message: "Bu sifariş artıq ləğv edilib." });
        }
        if (sifaris.status !== 'Gözləyir') {
            return res.status(400).json({
                message: `Bu sifariş artıq "${sifaris.status}" mərhələsindədir və ləğv edilə bilməz!`
            });
        }

        sifaris.status = 'Ləğv edildi';
        await sifaris.save();

        // Biznes Məntiqi: Məhsulları anbara (stoka) geri qaytarırıq
        for (const item of sifaris.mehsullar) {
            const productDoc = await Product.findById(item.product);
            if (productDoc) {
                productDoc.stokSayi = (productDoc.stokSayi || 0) + item.say;
                productDoc.satisSayi = Math.max(0, (productDoc.satisSayi || 0) - item.say);
                await productDoc.save();
            }
        }

        res.status(200).json({
            message: "Sifarişiniz ləğv edildi və məhsullar stoka geri qaytarıldı! 🔄",
            sifaris
        });
    } catch (error) {
        res.status(500).json({ message: "Xəta baş verdi", xeta: error.message });
    }
};
