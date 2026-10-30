import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Product from './models/Product.js';

export const initialProducts = [
    {
        basliq: "Apple iPhone 16 Pro Max 256GB - Titan Qara",
        tesvir: "Apple A18 Pro çipi, 6.9 düym Super Retina XDR ekran, 48 MP təkmil kamera sistemi və titan korpus.",
        qiymet: 3199,
        kategoriya: "Smartfonlar",
        sekilUrl: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80",
        satisSayi: 85,
        reyting: 5,
        reySayi: 142
    },
    {
        basliq: "Samsung Galaxy S24 Ultra 512GB - Titanium Gray",
        tesvir: "Galaxy AI süni intellekt imkanları, Snapdragon 8 Gen 3 prosessor və daxili S-Pen qələmi.",
        qiymet: 2899,
        kategoriya: "Smartfonlar",
        sekilUrl: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80",
        satisSayi: 64,
        reyting: 5,
        reySayi: 98
    },
    {
        basliq: "Apple MacBook Pro 16\" M3 Pro 18GB / 512GB SSD - Space Black",
        tesvir: "Peşəkarlar üçün M3 Pro çipi, Liquid Retina XDR ekran və 22 saatadək batareya ömrü.",
        qiymet: 4899,
        kategoriya: "Noutbuklar & PC",
        sekilUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
        satisSayi: 42,
        reyting: 5,
        reySayi: 67
    },
    {
        basliq: "ASUS ROG Zephyrus G16 OLED Gaming Laptop",
        tesvir: "Intel Core Ultra 9, RTX 4080 16GB, 240Hz ROG Nebula OLED ekran - güc və zərifliyin simvolu.",
        qiymet: 3750,
        kategoriya: "Noutbuklar & PC",
        sekilUrl: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80",
        satisSayi: 29,
        reyting: 5,
        reySayi: 35
    },
    {
        basliq: "Sony WH-1000XM5 Simsiz Küyboğucu Qulaqlıq",
        tesvir: "Sənaye lideri aktiv küyboğma (ANC), 30 saat dinləmə və kristal təmiz zəng keyfiyyəti.",
        qiymet: 749,
        kategoriya: "Qulaqlıqlar & Audio",
        sekilUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
        satisSayi: 130,
        reyting: 5,
        reySayi: 210
    },
    {
        basliq: "Apple AirPods Pro 2 (USB-C) MagSafe",
        tesvir: "H2 çipi ilə 2 qat daha güclü ANC, Adaptiv Səs və fərdiləşdirilmiş Məkan Səsi.",
        qiymet: 549,
        kategoriya: "Qulaqlıqlar & Audio",
        sekilUrl: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80",
        satisSayi: 220,
        reyting: 5,
        reySayi: 340
    },
    {
        basliq: "Apple Watch Ultra 2 GPS + Cellular 49mm Titan",
        tesvir: "Aerokosmik titan korpus, 3000 nit parlaq ekran, 36 saatlıq batareya və ekstremal idman göstəriciləri.",
        qiymet: 1799,
        kategoriya: "Smart Saatlar",
        sekilUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
        satisSayi: 38,
        reyting: 5,
        reySayi: 56
    },
    {
        basliq: "Samsung Galaxy Watch 6 Classic 47mm Qara",
        tesvir: "Fırlanan mexaniki bezel, təkmil yuxu izləmə və EKQ ürək ritmi monitorinqi.",
        qiymet: 599,
        kategoriya: "Smart Saatlar",
        sekilUrl: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80",
        satisSayi: 70,
        reyting: 5,
        reySayi: 82
    },
    {
        basliq: "Apple iPad Pro 11\" M4 OLED 256GB Wi-Fi Space Black",
        tesvir: "Ultra Retina XDR Tandem OLED ekran, inqilabi M4 prosessor və cəmi 5.3 mm incə korpus.",
        qiymet: 2299,
        kategoriya: "Planşetlər & Digər",
        sekilUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80",
        satisSayi: 31,
        reyting: 5,
        reySayi: 44
    },
    {
        basliq: "Sony PlayStation 5 Slim 1TB + DualSense Simsiz Pult",
        tesvir: "Ultra sürətli xüsusi SSD, 4K 120Hz dəstəyi və immersiv haptik toxunuşlu DualSense pultu.",
        qiymet: 1199,
        kategoriya: "Oyun & Konsollar",
        sekilUrl: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80",
        satisSayi: 310,
        reyting: 5,
        reySayi: 412
    }
];

async function seedDatabase() {
    try {
        console.log("MongoDB-yə qoşulur...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Qoşuldu! Köhnə test məhsulları təmizlənir...");
        await Product.deleteMany({});
        console.log("10 ədəd premium məhsul əlavə edilir...");
        await Product.insertMany(initialProducts);
        console.log("✅ UĞURLA TAMAMLANDI! Bütün məhsullar bazaya yazıldı.");
        process.exit(0);
    } catch (err) {
        console.error("Xəta baş verdi:", err);
        process.exit(1);
    }
}

if (process.argv[1].endsWith('seed.js')) {
    seedDatabase();
}

