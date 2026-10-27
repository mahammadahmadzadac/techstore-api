import express from 'express';
import {
    createProduct,
    getAllProducts,  // 👈 buranı getAllProducts edin
    getProductById,
    updateProduct,
    deleteProduct
} from '../controllers/productController.js';
import { gozetci, adminGozetci } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. Bütün məhsulları gətir
router.get('/', getAllProducts);  // 👈 buranı da getAllProducts edin

// 2. ID ilə tək bir məhsulu gətir
router.get('/:id', getProductById);

// 3. Yeni məhsul əlavə et
router.post('/', gozetci, adminGozetci, createProduct);

// 4. Məhsulu yenilə
router.put('/:id', gozetci, adminGozetci, updateProduct);

// 5. Məhsulu sil
router.delete('/:id', gozetci, adminGozetci, deleteProduct);

export default router;
