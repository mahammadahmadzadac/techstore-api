import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    // 1. Sifarişi verən müştəri (User cədvəli ilə əlaqə )
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // 2. Səbətdəki məhsullar 
    mehsullar: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            say: {
                type: Number,
                required: true,
                default: 1
            },
            qiymet: {
                type: Number,
                required: true
            }
        }
    ],
    // 3. Ümumi yekun məbləğ (AZN)
    umumiQiymet: {
        type: Number,
        required: true
    },
    // 4. Sifarişin vəziyyəti (status) :  
    status: {
        type: String,
        default: 'Gözləyir', // 'Gözləyir', 'Çatdırılır', 'Tamamlandı', 'Ləğv edildi'
        enum: ['Gözləyir', 'Çatdırılır', 'Tamamlandı', 'Ləğv edildi']
    },
    // 5. Biznes Məntiqi: Çatdırılma ünvanı və əlaqə məlumatları (Köhnə sifarişlərlə uyğunluq üçün defolt dəyərlərlə)
    unvan: {
        type: String,
        default: 'Göstərilməyib'
    },
    telefon: {
        type: String,
        default: '-'
    },
    kuryerQeydi: {
        type: String,
        default: ''
    },
    odenisNovu: {
        type: String,
        default: 'Qapıda Nağd',
        enum: ['Qapıda Nağd', 'Kartla']
    }
}, {
    timestamps: true // Sifarişin dəqiq verilmə vaxtı (createdAt), yenilənmə vaxtı (updatedAt)
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
