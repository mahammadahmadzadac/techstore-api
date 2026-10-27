import express from 'express';
import {
    createOrder,
    getMyOrders,
    getAllOrders,
    updateOrderStatus
} from '../controllers/orderController.js';
import { gozetci, adminGozetci } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. Yeni sifariş ver (Giriş etmiş istənilən müştəri)
router.post('/', gozetci, createOrder);

// 2. Müştərinin yalnız öz sifarişlərini görməsi (Giriş etmiş müştəri)
router.get('/myorders', gozetci, getMyOrders);

// 3. Bütün sifarişləri görmək (Yalnız Admin)
router.get('/', gozetci, adminGozetci, getAllOrders);

// 4. Sifarişin statusunu yeniləmək (Yalnız Admin)
router.put('/:id/status', gozetci, adminGozetci, updateOrderStatus);

export default router;
