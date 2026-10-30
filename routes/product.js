import express from 'express';
import {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    seedProducts
} from '../controllers/productController.js';
import { gozetci, adminGozetci } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getAllProducts);
router.post('/seed', seedProducts);
router.get('/seed', seedProducts); // Brauzerdən birbaşa yoxlamaq üçün də əlçatandır
router.get('/:id', getProductById);
router.post('/', gozetci, adminGozetci, createProduct);
router.put('/:id', gozetci, adminGozetci, updateProduct);
router.delete('/:id', gozetci, adminGozetci, deleteProduct);

export default router;
