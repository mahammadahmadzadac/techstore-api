# ⚡ TechStore — Full-Stack E-Commerce RESTful API & Storefront

Node.js, Express.js və MongoDB Atlas üzərində qurulmuş tam funksional, təhlükəsiz və sənaye standartlarına uyğun elektron ticarət (E-Commerce) platforması.

---

## 🛠️ Texnologiyalar (Tech Stack)

* **Backend:** Node.js, Express.js (Modern ES Modules)
* **Verilənlər Bazası:** MongoDB Atlas (Mongoose ODM)
* **Təhlükəsizlik:** JWT (JSON Web Tokens), Bcrypt.js (Password Hashing), RBAC (Role-Based Access Control)
* **Frontend:** Vanilla HTML5, Modern CSS3 (Glassmorphism, Dark Theme), Vanilla JavaScript (Async/Await)

---

## ✨ Əsas Özəlliklər

1. **İstifadəçi Sistemi (Authentication & Security):**
   * Qeydiyyat (`/register`) və Giriş (`/login`).
   * Parolların `bcrypt` ilə duzlanması və geri qaytarıla bilməyən şifrələnməsi.
   * `JWT` təhlükəsizlik tokenləri ilə sessiya idarəetməsi.

2. **Mühafizə Zənciri (RBAC Middleware):**
   * `gozetci` — Bilet (Token) yoxlanışı (Authentication).
   * `adminGozetci` — Yalnız Admin səlahiyyəti olan istifadəçilərin idarəetməsi (Authorization).

3. **Məhsul Kataloqu (Full CRUD):**
   * Məhsul əlavə etmək, hamısını görmək, ID ilə tək məhsul axtarmaq, yeniləmək və silmək.
   * Dinamik kateqoriyalar və şəkil (URL) dəstəyi.

4. **Sifarişlər Sistemi & Münasibətlər (Order System & Relationships):**
   * Müştərilər üçün səbət və sifariş yaratmaq (`POST /api/orders`).
   * Müştərinin yalnız öz sifarişlərini görməsi (`GET /api/orders/myorders`).
   * Admin üçün bütün sifarişlərin monitorinqi (`GET /api/orders`).
   * **Mongoose `.populate()`:** Sifariş çeki ilə müştəri və məhsul detallarının dinamik birləşdirilməsi.
   * Sifarişin statusunun idarə edilməsi (`PUT /api/orders/:id/status` — Gözləyir ➔ Çatdırılır ➔ Tamamlandı).

5. **Canlı İnteraktiv Vitrin (Storefront):**
   * Qaranlıq rejim, müasir kartlar, canlı səbət, modal pəncərələr və bildirişlər (Toast).

---

## 📡 API Marşrutları (Endpoints)

### 🔐 İstifadəçi (Auth)
| Metod | Link | Giriş İcazəsi | Açıqlama |
|---|---|---|---|
| `POST` | `/api/auth/register` | Hər kəs | Yeni istifadəçi qeydiyyatı |
| `POST` | `/api/auth/login` | Hər kəs | Giriş etmək və JWT Token almaq |

### 📱 Məhsullar (Products)
| Metod | Link | Giriş İcazəsi | Açıqlama |
|---|---|---|---|
| `GET` | `/api/products` | Hər kəs | Bütün məhsulları oxumaq |
| `GET` | `/api/products/:id` | Hər kəs | ID ilə tək məhsulu gətirmək |
| `POST` | `/api/products` | Yalnız Admin | Yeni məhsul yaratmaq |
| `PUT` | `/api/products/:id` | Yalnız Admin | Məhsulu yeniləmək |
| `DELETE` | `/api/products/:id` | Yalnız Admin | Məhsulu bazadan silmək |

### 🛒 Sifarişlər (Orders)
| Metod | Link | Giriş İcazəsi | Açıqlama |
|---|---|---|---|
| `POST` | `/api/orders` | Giriş etmiş istifadəçi | Yeni sifariş vermək |
| `GET` | `/api/orders/myorders` | Giriş etmiş istifadəçi | Öz sifarişlərini görmək (`populate`) |
| `GET` | `/api/orders` | Yalnız Admin | Bütün mağaza sifarişlərini görmək |
| `PUT` | `/api/orders/:id/status` | Yalnız Admin | Sifarişin statusunu yeniləmək |

---

## 💻 Kompüterdə Quraşdırma (Local Setup)

1. **Repozitoriyanı klonlayın:**
   ```bash
   git clone https://github.com/USERNAME/techstore-api.git
   cd techstore-api
   ```

2. **Paketləri yükləyin:**
   ```bash
   npm install
   ```

3. **`.env` faylını yaradın:**
   `.env.example` faylından nümunə götürərək `.env` faylı yaradın və MongoDB Atlas linkinizi əlavə edin:
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://...
   JWT_SECRET=gizli_sifreniz
   ```

4. **Serveri işə salın:**
   ```bash
   npm start
   ```

5. Brauzerdə `http://localhost:5000` ünvanını açın!

---

## 👨‍💻 Müəllif
**Məhəmməd Əhmədzadə** — *Junior Backend Developer*
