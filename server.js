import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/product.js';
import orderRoutes from './routes/order.js';


// env dəki məlumatlar üçün
dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.static('public')); // Statik Frontend faylları üçün
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);



//Bazaya qoşulaq

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB-yə qoşuldu!"))
    .catch(err => console.log("❌ MongoDB xətası:", err));








// Serveri işə salırıq
app.listen(PORT, () => {
    console.log(`Server ${PORT} portunda işləyir. `)
})
