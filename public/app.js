// ==================== STATE MANAGEMENT ====================
let state = {
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
    cart: JSON.parse(localStorage.getItem('cart')) || [],
    products: [],
    authMode: 'login' // 'login' və ya 'register'
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupModalsLightDismiss();
});

function initApp() {
    updateNavUser();
    updateCartBadge();
    fetchProducts();
    setupEventListeners();
}

function setupEventListeners() {
    // Nav Buttons
    const openAuthBtn = document.getElementById('openAuthBtn');
    if (openAuthBtn) {
        openAuthBtn.addEventListener('click', () => openModal('authModal'));
    }

    document.getElementById('cartBtn').addEventListener('click', () => {
        renderCartModal();
        openModal('cartModal');
    });

    document.getElementById('myOrdersBtn').addEventListener('click', () => {
        fetchMyOrders();
        openModal('myOrdersModal');
    });

    document.getElementById('adminPanelBtn').addEventListener('click', () => {
        fetchAdminOrders();
        openModal('adminModal');
    });

    const addProductBtn = document.getElementById('adminAddProductBtn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => openModal('addProductModal'));
    }

    // Category Filter Pills
    document.querySelectorAll('.pill').forEach(pill => {
        pill.addEventListener('click', (e) => {
            document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            const category = pill.getAttribute('data-category');
            filterProducts(category);
        });
    });
}

// Light dismiss for <dialog> (backdrop click to close)
function setupModalsLightDismiss() {
    document.querySelectorAll('dialog.modal-dialog').forEach(dialog => {
        dialog.addEventListener('click', (e) => {
            const rect = dialog.getBoundingClientRect();
            const isInDialog = (
                rect.top <= e.clientY &&
                e.clientY <= rect.top + rect.height &&
                rect.left <= e.clientX &&
                e.clientX <= rect.left + rect.width
            );
            if (!isInDialog) {
                dialog.close();
            }
        });
    });
}

function openModal(id) {
    const dialog = document.getElementById(id);
    if (dialog && typeof dialog.showModal === 'function') {
        dialog.showModal();
    }
}

// ==================== PRODUCTS API ====================
async function fetchProducts() {
    const grid = document.getElementById('productsGrid');
    try {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error('Məhsulları yükləmək mümkün olmadı.');
        const data = await res.json();
        state.products = data;
        renderProducts(state.products);
    } catch (err) {
        grid.innerHTML = `
            <div class="empty-state">
                <p>⚠️ Məhsullar yüklənərkən xəta baş verdi: ${err.message}</p>
                <button class="btn btn-outline" onclick="fetchProducts()" style="margin-top:1rem;">Yenidən cəhd et</button>
            </div>
        `;
    }
}

function renderProducts(items) {
    const grid = document.getElementById('productsGrid');
    if (!items || items.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <p>📦 Hələlik heç bir məhsul əlavə edilməyib.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = items.map(product => {
        const cat = (product.kategoriya || '').toLowerCase();
        const t = (product.basliq || '').toLowerCase();
        let icon = '⚡';
        if (cat.includes('smartfon') || cat.includes('telefon') || t.includes('iphone') || t.includes('samsung') || t.includes('redmi')) icon = '📱';
        else if (cat.includes('noutbuk') || cat.includes('pc') || t.includes('macbook') || t.includes('asus') || t.includes('dell')) icon = '💻';
        else if (cat.includes('qulaqlıq') || cat.includes('audio') || t.includes('airpods') || t.includes('buds')) icon = '🎧';
        else if (cat.includes('saat') || t.includes('watch')) icon = '⌚';
        else if (cat.includes('planşet') || t.includes('ipad') || t.includes('tab')) icon = '📟';
        else if (cat.includes('aksesuar')) icon = '🔌';

        const mediaHtml = product.sekilUrl ? `
            <div class="product-media">
                <img src="${escapeHtml(product.sekilUrl)}" alt="${escapeHtml(product.basliq)}" class="product-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="product-icon-wrap" style="display:none;">${icon}</div>
            </div>
        ` : `
            <div class="product-media">
                <div class="product-icon-wrap">${icon}</div>
            </div>
        `;

        return `
            <div class="product-card">
                <div>
                    <div class="card-top">
                        <span class="category-badge">${escapeHtml(product.kategoriya || 'Elektronika')}</span>
                        <span class="rating-badge">⭐ ${product.reyting || 5}.0</span>
                    </div>

                    ${mediaHtml}
                    <h3 class="product-title">${escapeHtml(product.basliq)}</h3>
                    <p class="product-desc">${escapeHtml(product.tesvir)}</p>
                </div>

                <div class="card-footer">
                    <div class="product-price">
                        <span class="price-label">Qiymət</span>
                        <span class="price-value">${product.qiymet} AZN</span>
                    </div>

                    <button class="btn btn-primary" onclick="addToCart('${product._id}')">
                        <span>+ Səbətə at</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function filterProducts(category) {
    if (category === 'all') {
        renderProducts(state.products);
    } else {
        const target = category.toLowerCase();
        const filtered = state.products.filter(p => {
            const pCat = (p.kategoriya || '').toLowerCase();
            return pCat === target || pCat.includes(target) || target.includes(pCat);
        });
        renderProducts(filtered);
    }
}

// ==================== CART MANAGEMENT ====================
function addToCart(productId) {
    const product = state.products.find(p => p._id === productId);
    if (!product) return;

    const existingItem = state.cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.say += 1;
    } else {
        state.cart.push({
            id: product._id,
            basliq: product.basliq,
            qiymet: product.qiymet,
            say: 1
        });
    }

    saveCart();
    updateCartBadge();
    showToast(`"${product.basliq}" səbətə əlavə edildi! 🛒`);
}

function changeQty(productId, delta) {
    const item = state.cart.find(i => i.id === productId);
    if (!item) return;

    item.say += delta;
    if (item.say <= 0) {
        state.cart = state.cart.filter(i => i.id !== productId);
    }

    saveCart();
    updateCartBadge();
    renderCartModal();
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(state.cart));
}

function updateCartBadge() {
    const badge = document.getElementById('cartCountBadge');
    const totalCount = state.cart.reduce((sum, item) => sum + item.say, 0);
    badge.textContent = totalCount;
}

function renderCartModal() {
    const list = document.getElementById('cartItemsList');
    const totalEl = document.getElementById('cartTotalPrice');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (state.cart.length === 0) {
        list.innerHTML = `<div class="empty-state"><p>Səbətiniz boşdur 🛍️</p></div>`;
        totalEl.textContent = '0 AZN';
        checkoutBtn.disabled = true;
        return;
    }

    checkoutBtn.disabled = false;
    let total = 0;

    list.innerHTML = state.cart.map(item => {
        const itemTotal = item.qiymet * item.say;
        total += itemTotal;

        return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${escapeHtml(item.basliq)}</h4>
                    <span>${item.qiymet} AZN × ${item.say} = ${itemTotal} AZN</span>
                </div>
                <div class="cart-item-controls">
                    <button class="btn-qty" onclick="changeQty('${item.id}', -1)">-</button>
                    <span>${item.say}</span>
                    <button class="btn-qty" onclick="changeQty('${item.id}', 1)">+</button>
                </div>
            </div>
        `;
    }).join('');

    totalEl.textContent = `${total} AZN`;
}

// Checkout (Sifarişi Göndər)
async function handleCheckout() {
    if (!state.token) {
        document.getElementById('cartModal').close();
        openModal('authModal');
        showToast('Sifariş vermək üçün əvvəlcə daxil olun! 🔒');
        return;
    }

    if (state.cart.length === 0) {
        showToast('Səbətiniz boşdur!');
        return;
    }

    const checkoutBtn = document.getElementById('checkoutBtn');
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Sifariş göndərilir...';

    // Body formatı (orderController-ə uyğun)
    const payload = {
        mehsullar: state.cart.map(item => ({
            product: item.id,
            say: item.say,
            qiymet: item.qiymet
        })),
        umumiQiymet: state.cart.reduce((sum, item) => sum + (item.qiymet * item.say), 0)
    };

    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Sifariş qəbul olunmadı');

        // Uğurlu oldu! Səbəti təmizləyirik
        state.cart = [];
        saveCart();
        updateCartBadge();
        document.getElementById('cartModal').close();

        showToast('Təbriklər! Sifarişiniz qəbul edildi! 🎉📦');
    } catch (err) {
        showToast(`Xəta: ${err.message}`);
    } finally {
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = 'Sifarişi Təsdiqlə və Al';
    }
}

// ==================== AUTHENTICATION ====================
function switchAuthTab(mode) {
    state.authMode = mode;
    const isLogin = mode === 'login';

    document.getElementById('loginTabBtn').classList.toggle('active', isLogin);
    document.getElementById('registerTabBtn').classList.toggle('active', !isLogin);
    document.getElementById('nameFieldGroup').style.display = isLogin ? 'none' : 'block';
    document.getElementById('authModalTitle').textContent = isLogin ? 'Hesaba Giriş' : 'Yeni Qeydiyyat';
    document.getElementById('authSubmitBtn').innerHTML = `<span>${isLogin ? 'Daxil Ol' : 'Qeydiyyatdan Keç'}</span>`;
    document.getElementById('authAlert').style.display = 'none';
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    const alertEl = document.getElementById('authAlert');
    alertEl.style.display = 'none';

    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    const ad = document.getElementById('authName').value.trim();

    const isLogin = state.authMode === 'login';
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin ? { email, password } : { ad, email, password };

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.err || 'Xəta baş verdi');

        if (isLogin) {
            state.token = data.token;
            state.user = data.user;
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            document.getElementById('authModal').close();
            updateNavUser();
            showToast(`Xoş gəldiniz, ${data.user.ad || 'İstifadəçi'}! 👋`);
        } else {
            showToast('Qeydiyyat uğurla tamamlandı! İndi daxil ola bilərsiniz.');
            switchAuthTab('login');
        }
    } catch (err) {
        alertEl.textContent = err.message;
        alertEl.className = 'alert alert-danger';
        alertEl.style.display = 'block';
    }
}

function logout() {
    state.token = null;
    state.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    updateNavUser();
    showToast('Hesabdan çıxış edildi.');
}

function updateNavUser() {
    const area = document.getElementById('userProfileArea');
    const myOrdersBtn = document.getElementById('myOrdersBtn');
    const adminPanelBtn = document.getElementById('adminPanelBtn');
    const adminAddProductBtn = document.getElementById('adminAddProductBtn');

    if (state.token && state.user) {
        const isAdmin = state.user.role === 'admin';

        area.innerHTML = `
            <div class="user-tag">
                <span>👤 ${escapeHtml(state.user.ad || state.user.email)}</span>
                ${isAdmin ? '<span style="color:#fbbf24; font-size:0.75rem;">(Admin)</span>' : ''}
                <button class="btn-logout" onclick="logout()" title="Çıxış">✕</button>
            </div>
        `;

        myOrdersBtn.style.display = 'inline-flex';
        adminPanelBtn.style.display = isAdmin ? 'inline-flex' : 'none';
        if (adminAddProductBtn) {
            adminAddProductBtn.style.display = isAdmin ? 'inline-flex' : 'none';
        }
    } else {
        area.innerHTML = `
            <button id="openAuthBtn" class="btn btn-primary" onclick="openModal('authModal')">
                <span class="icon">👤</span>
                <span>Daxil ol</span>
            </button>
        `;
        myOrdersBtn.style.display = 'none';
        adminPanelBtn.style.display = 'none';
        if (adminAddProductBtn) {
            adminAddProductBtn.style.display = 'none';
        }
    }
}

// ==================== MY ORDERS (CUSTOMER) ====================
async function fetchMyOrders() {
    const list = document.getElementById('myOrdersList');
    list.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Sifarişləriniz gətirilir...</p></div>`;

    try {
        const res = await fetch('/api/orders/myorders', {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Sifarişləri oxumaq olmadı');

        if (data.length === 0) {
            list.innerHTML = `<div class="empty-state"><p>Hələ heç bir sifarişiniz yoxdur. Vitrindən seçim edin! 🛒</p></div>`;
            return;
        }

        list.innerHTML = data.map(order => {
            const dateStr = new Date(order.createdAt).toLocaleString('az-AZ');
            const itemsHtml = order.mehsullar.map(m => {
                const title = m.product ? m.product.basliq : 'Məhsul';
                return `<div>• ${escapeHtml(title)} — ${m.say} ədəd × ${m.qiymet} AZN</div>`;
            }).join('');

            return `
                <div class="order-card">
                    <div class="order-top">
                        <span class="order-id">ID: ${order._id}</span>
                        <span class="status-pill status-${order.status}">${order.status}</span>
                    </div>
                    <div class="order-products">
                        ${itemsHtml}
                    </div>
                    <div class="order-footer">
                        <small style="color:var(--text-dim);">${dateStr}</small>
                        <strong style="color:var(--accent-cyan); font-size:1.1rem;">Yekun: ${order.umumiQiymet} AZN</strong>
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        list.innerHTML = `<div class="empty-state"><p>Xəta: ${err.message}</p></div>`;
    }
}

// ==================== ADMIN ORDERS & STATUS ====================
async function fetchAdminOrders() {
    const list = document.getElementById('adminOrdersList');
    list.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Bütün sifarişlər gətirilir...</p></div>`;

    try {
        const res = await fetch('/api/orders', {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Sifarişləri oxumaq olmadı');

        if (data.length === 0) {
            list.innerHTML = `<div class="empty-state"><p>Mağazada hələ heç bir sifariş yoxdur.</p></div>`;
            return;
        }

        list.innerHTML = data.map(order => {
            const dateStr = new Date(order.createdAt).toLocaleString('az-AZ');
            const customerName = order.user ? `${order.user.ad} (${order.user.email})` : 'Anonim Müştəri';
            const itemsHtml = order.mehsullar.map(m => {
                const title = m.product ? m.product.basliq : 'Məhsul';
                return `<div>• ${escapeHtml(title)} — ${m.say} ədəd (${m.qiymet} AZN)</div>`;
            }).join('');

            return `
                <div class="order-card">
                    <div class="order-top">
                        <div>
                            <strong style="color:#fff;">👤 ${escapeHtml(customerName)}</strong>
                            <div class="order-id">Sifariş ID: ${order._id}</div>
                        </div>
                        <div>
                            <select class="admin-status-select" onchange="changeOrderStatus('${order._id}', this.value)">
                                <option value="Gözləyir" ${order.status === 'Gözləyir' ? 'selected' : ''}>🟡 Gözləyir</option>
                                <option value="Çatdırılır" ${order.status === 'Çatdırılır' ? 'selected' : ''}>🔵 Çatdırılır</option>
                                <option value="Tamamlandı" ${order.status === 'Tamamlandı' ? 'selected' : ''}>🟢 Tamamlandı</option>
                            </select>
                        </div>
                    </div>
                    <div class="order-products">
                        ${itemsHtml}
                    </div>
                    <div class="order-footer">
                        <small style="color:var(--text-dim);">${dateStr}</small>
                        <strong style="color:var(--accent-cyan); font-size:1.1rem;">Yekun: ${order.umumiQiymet} AZN</strong>
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        list.innerHTML = `<div class="empty-state"><p>Xəta: ${err.message}</p></div>`;
    }
}

async function changeOrderStatus(orderId, newStatus) {
    try {
        const res = await fetch(`/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Statusu dəyişmək olmadı');

        showToast(`Sifariş #${orderId.slice(-4)} statusu: "${newStatus}" edildi! ✅`);
    } catch (err) {
        showToast(`Xəta: ${err.message}`);
    }
}

// Admin Məhsul Əlavə Etmə
async function handleAddProductSubmit(e) {
    e.preventDefault();
    const basliq = document.getElementById('prodTitle').value.trim();
    const tesvir = document.getElementById('prodDesc').value.trim();
    const sekilUrl = document.getElementById('prodImage').value.trim();
    const qiymet = Number(document.getElementById('prodPrice').value);
    const kategoriya = document.getElementById('prodCategory').value;

    const payload = { basliq, tesvir, qiymet, kategoriya };
    if (sekilUrl) {
        payload.sekilUrl = sekilUrl;
    }

    try {
        const res = await fetch('/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Məhsul əlavə edilmədi');

        showToast('Yeni məhsul uğurla vitrinə əlavə edildi! 📱✨');
        document.getElementById('addProductModal').close();
        document.getElementById('addProductForm').reset();
        fetchProducts(); // Vitrini yeniləyirik
    } catch (err) {
        showToast(`Xəta: ${err.message}`);
    }
}

// ==================== TOAST HELPER ====================
function showToast(message) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
