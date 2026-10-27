import express from 'express';
// Bayaq yazdığımız beyni (funksiyanı) bura çağırırıq

import { register, login } from '../controllers/authController.js';

// Express-in qapıçı (Router) sistemini işə salırıq
const router = express.Router();

// Qeydiyyat qapısı :  Biri POST sorğusu ilə "/register" linkinə gəlsə, register funksiyası işləsin

router.post('/register', register);
router.post('/login', login);

// Qapını digər faylların istifadəsi üçün ixrac edirik
export default router;