// ===================================================================
// TechStore - Client-side Application Logic
// Author: Məhəmməd Əhmədzadə
// ===================================================================

let state = {
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
    cart: JSON.parse(localStorage.getItem('cart')) || [],
    wishlist: JSON.parse(localStorage.getItem('wishlist')) || [],
    products: [],
    authMode: 'login',
    searchQuery: '',
    selectedCategory: 'all',
    selectedSort: 'default',
    theme: localStorage.getItem('theme') || 'dark',
    activeProductId: null,
    detailQty: 1,
    reviewRating: 5
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initApp();
    setupModalsLightDismiss();
});

function initTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    const icon = document.getElementById('themeIcon');
    if (icon) {
        icon.textContent = state.theme === 'dark' ? '🌙' : '☀️';
    }

    const toggleBtn = document.getElementById('themeToggleBtn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleTheme);
    }
}

function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', state.theme);
    localStorage.setItem('theme', state.theme);
    const icon = document.getElementById('themeIcon');
    if (icon) {
        icon.textContent = state.theme === 'dark' ? '🌙' : '☀️';
    }
    showToast(state.theme === 'dark' ? 'Qaranlıq rejim aktiv edildi 🌙' : 'İşıqlı rejim aktiv edildi ☀️');
}

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

    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            renderCartModal();
            openModal('cartModal');
        });
    }

    const myOrdersBtn = document.getElementById('myOrdersBtn');
    if (myOrdersBtn) {
        myOrdersBtn.addEventListener('click', () => {
            fetchMyOrders();
            openModal('myOrdersModal');
        });
    }

    const adminPanelBtn = document.getElementById('adminPanelBtn');
    if (adminPanelBtn) {
        adminPanelBtn.addEventListener('click', () => {
            fetchAdminOrders();
            openModal('adminModal');
        });
    }

    const addProductBtn = document.getElementById('adminAddProductBtn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => openModal('addProductModal'));
    }

    // Search Input in Header
    const searchInput = document.getElementById('productSearchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value.trim().toLowerCase();
            if (clearSearchBtn) {
                clearSearchBtn.style.display = state.searchQuery ? 'block' : 'none';
            }
            if (state.activeProductId) {
                closeProductDetail();
            }
            applyFiltersAndRender();
        });
    }

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            state.searchQuery = '';
            clearSearchBtn.style.display = 'none';
            applyFiltersAndRender();
        });
    }

    // Category Tabs in Subnav
    document.querySelectorAll('.cat-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            state.selectedCategory = tab.getAttribute('data-category');
            if (state.activeProductId) {
                closeProductDetail();
            }
            applyFiltersAndRender();
        });
    });
}

function handleSortChange(sortValue) {
    state.selectedSort = sortValue;
    applyFiltersAndRender();
}

function filterByCategory(category) {
    const tab = document.querySelector(`[data-category="${category}"]`);
    if (tab) {
        tab.click();
        const catalogEl = document.getElementById('catalogAnchor');
        if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
}

function resetFilters() {
    state.searchQuery = '';
    state.selectedCategory = 'all';
    state.selectedSort = 'default';

    const searchInput = document.getElementById('productSearchInput');
    if (searchInput) searchInput.value = '';
    const clearBtn = document.getElementById('clearSearchBtn');
    if (clearBtn) clearBtn.style.display = 'none';

    document.querySelectorAll('.cat-tab').forEach(t => {
        t.classList.toggle('active', t.getAttribute('data-category') === 'all');
    });

    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) sortSelect.value = 'default';

    applyFiltersAndRender();
}

// ==================== PRODUCTS FETCH & RENDER ====================
async function fetchProducts() {
    const grid = document.getElementById('productsGrid');
    try {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error('Məhsullar yüklənmədi');
        const data = await res.json();
        state.products = data;
        applyFiltersAndRender();
    } catch (err) {
        if (grid) {
            grid.innerHTML = `
                <div class="empty-state">
                    <p style="font-size:1.5rem; margin-bottom:0.5rem;">⚠️</p>
                    <p>Məhsulları bazadan yükləmək mümkün olmadı: ${escapeHtml(err.message)}</p>
                </div>
            `;
        }
    }
}

function getProductIcon(product) {
    let icon = '⚡';
    const t = (product.basliq || '').toLowerCase();
    const c = (product.kategoriya || '').toLowerCase();
    if (c.includes('smartfon') || t.includes('iphone') || t.includes('samsung')) icon = '📱';
    else if (c.includes('noutbuk') || t.includes('macbook') || t.includes('laptop')) icon = '💻';
    else if (c.includes('audio') || c.includes('qulaqlıq') || t.includes('sony') || t.includes('airpods')) icon = '🎧';
    else if (c.includes('saat') || t.includes('watch')) icon = '⌚';
    else if (c.includes('planşet') || t.includes('ipad')) icon = '📟';
    else if (c.includes('oyun') || t.includes('playstation') || t.includes('ps5')) icon = '🎮';
    return icon;
}

function getProductRatingInfo(product) {
    const reviews = Array.isArray(product.reyler) ? product.reyler : [];
    if (reviews.length > 0) {
        const sum = reviews.reduce((acc, r) => acc + (Number(r.reyting) || 5), 0);
        const avg = sum / reviews.length;
        return { rating: avg, count: reviews.length };
    }
    return {
        rating: Number(product.reyting) || 5,
        count: Number(product.reySayi) || 0
    };
}

function applyFiltersAndRender() {
    let items = [...state.products];

    // 1. Category Filter
    if (state.selectedCategory !== 'all') {
        const target = state.selectedCategory.toLowerCase();
        items = items.filter(p => {
            const cat = (p.kategoriya || '').toLowerCase();
            return cat === target || cat.includes(target) || target.includes(cat);
        });
    }

    // 2. Search Query Filter
    if (state.searchQuery) {
        items = items.filter(p => {
            const title = (p.basliq || '').toLowerCase();
            const desc = (p.tesvir || '').toLowerCase();
            const cat = (p.kategoriya || '').toLowerCase();
            return title.includes(state.searchQuery) || desc.includes(state.searchQuery) || cat.includes(state.searchQuery);
        });
    }

    // 3. Sorting
    if (state.selectedSort === 'price-asc') {
        items.sort((a, b) => Number(a.qiymet) - Number(b.qiymet));
    } else if (state.selectedSort === 'price-desc') {
        items.sort((a, b) => Number(b.qiymet) - Number(a.qiymet));
    } else if (state.selectedSort === 'rating') {
        items.sort((a, b) => getProductRatingInfo(b).rating - getProductRatingInfo(a).rating);
    } else if (state.selectedSort === 'sales') {
        items.sort((a, b) => (Number(b.satisSayi) || 0) - (Number(a.satisSayi) || 0));
    }

    // Update Counter & Filter Status
    const countText = document.getElementById('productsCountText');
    if (countText) {
        countText.textContent = `${items.length} premium məhsul nümayiş olunur (Məhsulun üzərinə klikləyərək rəylərə baxa bilərsiniz)`;
    }

    const filterStatusArea = document.getElementById('filterStatusArea');
    const filterStatusText = document.getElementById('filterStatusText');
    if (filterStatusArea && filterStatusText) {
        if (state.searchQuery || state.selectedCategory !== 'all') {
            filterStatusArea.style.display = 'flex';
            let label = [];
            if (state.selectedCategory !== 'all') label.push(`Kateqoriya: "${state.selectedCategory}"`);
            if (state.searchQuery) label.push(`Axtarış: "${state.searchQuery}"`);
            filterStatusText.textContent = `${label.join(' • ')} (${items.length} nəticə)`;
        } else {
            filterStatusArea.style.display = 'none';
        }
    }

    renderProductsGrid(items);
}

function renderProductsGrid(items) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    if (!items || items.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <p style="font-size: 2.2rem; margin-bottom: 0.5rem;">🔍</p>
                <h3 style="font-size: 1.15rem; margin-bottom: 0.5rem; color: var(--text-main);">Axtarışınıza uyğun heç bir məhsul tapılmadı</h3>
                <p style="margin-bottom: 1.2rem;">Fərqli açar sözlərlə axtarmağı və ya kateqoriya filtrini sıfırlamağı yoxlayın.</p>
                <button class="btn btn-primary" onclick="resetFilters()">Filtrləri Sıfırla</button>
            </div>
        `;
        return;
    }

    grid.innerHTML = items.map(product => {
        const cat = (product.kategoriya || 'Elektronika');
        const isWishlisted = state.wishlist.includes(product._id);
        const { rating, count } = getProductRatingInfo(product);
        const price = Number(product.qiymet) || 0;
        const oldPrice = Math.round(price * 1.12);
        const icon = getProductIcon(product);

        const mediaHtml = product.sekilUrl ? `
            <div class="card-media card-clickable" onclick="openProductDetail('${product._id}')">
                <img src="${escapeHtml(product.sekilUrl)}" alt="${escapeHtml(product.basliq)}" class="product-img" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="product-fallback-icon" style="display:none;">${icon}</div>
            </div>
        ` : `
            <div class="card-media card-clickable" onclick="openProductDetail('${product._id}')">
                <div class="product-fallback-icon">${icon}</div>
            </div>
        `;

        return `
            <article class="product-card" id="product-${product._id}">
                <div class="card-header">
                    <span class="card-badge badge-trend">🔥 Orijinal</span>
                    <button class="btn-wishlist ${isWishlisted ? 'active' : ''}" onclick="event.stopPropagation(); toggleWishlist('${product._id}')" title="İstək siyahısına əlavə et">
                        ${isWishlisted ? '❤️' : '🤍'}
                    </button>
                </div>

                ${mediaHtml}

                <div class="card-content">
                    <div class="meta-row">
                        <span class="cat-label">${escapeHtml(cat)}</span>
                        <div class="rating-stars card-clickable" onclick="openProductDetail('${product._id}')" title="Rəylərə bax">
                            <span>⭐</span>
                            <span>${rating.toFixed(1)}</span>
                            <span class="reviews-count-pill">(${count} rəy)</span>
                        </div>
                    </div>

                    <div class="card-clickable" onclick="openProductDetail('${product._id}')">
                        <h3 class="product-title" title="${escapeHtml(product.basliq)}">
                            ${escapeHtml(product.basliq)}
                        </h3>
                        <p class="product-desc">${escapeHtml(product.tesvir || '')}</p>
                    </div>

                    <div class="stock-status">
                        <span>●</span>
                        <span>Stokda var • 💬 Rəylərə bax və yaz</span>
                    </div>

                    <div class="card-footer">
                        <div class="price-box">
                            <span class="price-old">${formatPrice(oldPrice)}</span>
                            <span class="price-curr">${formatPrice(price)}</span>
                        </div>

                        <button class="btn-add-cart" onclick="event.stopPropagation(); addToCart('${product._id}')">
                            <span>🛒</span>
                            <span>Səbətə at</span>
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

// ==================== PRODUCT DETAIL PAGE & REVIEWS ====================
async function openProductDetail(productId) {
    let product = state.products.find(p => p._id === productId);
    if (!product) return;

    state.activeProductId = productId;
    state.detailQty = 1;
    state.reviewRating = 5;

    // Fetch fresh product data from backend to ensure latest reviews
    try {
        const res = await fetch(`/api/products/${productId}`);
        if (res.ok) {
            const freshProduct = await res.json();
            product = freshProduct;
            const idx = state.products.findIndex(p => p._id === productId);
            if (idx > -1) state.products[idx] = freshProduct;
        }
    } catch (_) {
        // Fallback to cached state product if offline
    }

    renderProductDetailView(product);

    const homeView = document.getElementById('homeView');
    const detailView = document.getElementById('productDetailView');
    if (homeView) homeView.style.display = 'none';
    if (detailView) detailView.style.display = 'block';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openFeaturedProductDetail() {
    const featured = state.products.find(p => (p.basliq || '').includes('iPhone 16 Pro Max')) || state.products[0];
    if (featured) {
        openProductDetail(featured._id);
    }
}

function closeProductDetail() {
    state.activeProductId = null;
    const homeView = document.getElementById('homeView');
    const detailView = document.getElementById('productDetailView');
    if (detailView) detailView.style.display = 'none';
    if (homeView) homeView.style.display = 'block';
    applyFiltersAndRender();
}

function renderProductDetailView(product) {
    const cat = product.kategoriya || 'Elektronika';
    const price = Number(product.qiymet) || 0;
    const oldPrice = Math.round(price * 1.12);
    const monthly = Math.ceil(price / 12);
    const { rating, count } = getProductRatingInfo(product);
    const icon = getProductIcon(product);
    const isWishlisted = state.wishlist.includes(product._id);

    // Breadcrumb & Titles
    document.getElementById('detailBreadcrumbCat').textContent = cat;
    document.getElementById('detailBreadcrumbTitle').textContent = product.basliq;
    document.getElementById('detailCategoryBadge').textContent = cat;
    document.getElementById('detailTitle').textContent = product.basliq;
    document.getElementById('detailDescription').textContent = product.tesvir || '';

    // Media
    const mediaBox = document.getElementById('detailMediaBox');
    if (product.sekilUrl) {
        mediaBox.innerHTML = `
            <img src="${escapeHtml(product.sekilUrl)}" alt="${escapeHtml(product.basliq)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="product-fallback-icon" style="display:none; font-size:5rem;">${icon}</div>
        `;
    } else {
        mediaBox.innerHTML = `<div class="product-fallback-icon" style="font-size:5rem;">${icon}</div>`;
    }

    // Ratings & Sales
    const starsStr = '⭐'.repeat(Math.round(rating)) || '⭐⭐⭐⭐⭐';
    document.getElementById('detailStarsText').textContent = `${starsStr} ${rating.toFixed(1)}`;
    document.getElementById('detailReviewsCountLink').textContent = `${count} müştəri rəyi`;
    document.getElementById('detailSalesCount').textContent = `${product.satisSayi || 45} ədəd satılıb`;

    // Prices
    document.getElementById('detailCurrentPrice').textContent = formatPrice(price);
    document.getElementById('detailOldPrice').textContent = formatPrice(oldPrice);
    document.getElementById('detailMonthlyPrice').textContent = formatPrice(monthly);

    // Qty & Buttons
    document.getElementById('detailQtyVal').textContent = state.detailQty;
    const addBtn = document.getElementById('detailAddToCartBtn');
    addBtn.onclick = () => addToCartWithQty(product._id, state.detailQty);

    const wishBtn = document.getElementById('detailWishlistBtn');
    wishBtn.innerHTML = `<span>${isWishlisted ? '❤️' : '🤍'}</span>`;
    wishBtn.onclick = () => {
        toggleWishlist(product._id);
        const nowWish = state.wishlist.includes(product._id);
        wishBtn.innerHTML = `<span>${nowWish ? '❤️' : '🤍'}</span>`;
    };

    // Reset Star Picker to 5
    selectReviewStar(5);

    // Render Reviews List
    renderReviewsSection(product);
}

function changeDetailQty(delta) {
    state.detailQty = Math.max(1, state.detailQty + delta);
    const el = document.getElementById('detailQtyVal');
    if (el) el.textContent = state.detailQty;
}

function addToCartWithQty(productId, qty) {
    const product = state.products.find(p => p._id === productId);
    if (!product) return;

    const existingIndex = state.cart.findIndex(item => item.id === productId);
    if (existingIndex > -1) {
        state.cart[existingIndex].say += qty;
    } else {
        state.cart.push({
            id: product._id,
            basliq: product.basliq,
            qiymet: Number(product.qiymet),
            sekilUrl: product.sekilUrl || '',
            say: qty
        });
    }

    saveCart();
    updateCartBadge();
    showToast(`${qty} ədəd "${product.basliq}" səbətə əlavə edildi! 🛒`);
}

function selectReviewStar(val) {
    state.reviewRating = val;
    const labels = {
        1: '1 / 5 (Çox zəif)',
        2: '2 / 5 (Zəif)',
        3: '3 / 5 (Orta)',
        4: '4 / 5 (Yaxşı)',
        5: '5 / 5 (Əla)'
    };

    document.querySelectorAll('#starPicker .star-btn').forEach(btn => {
        const bVal = Number(btn.getAttribute('data-val'));
        btn.classList.toggle('active', bVal <= val);
    });

    const lbl = document.getElementById('selectedStarText');
    if (lbl) lbl.textContent = labels[val] || '5 / 5';
}

function renderReviewsSection(product) {
    const reviews = Array.isArray(product.reyler) ? [...product.reyler].reverse() : [];
    const { rating } = getProductRatingInfo(product);

    document.getElementById('reviewsBigScore').textContent = rating.toFixed(1);
    document.getElementById('reviewsTotalSubtext').textContent = `${reviews.length} real alıcı rəyi`;
    document.getElementById('reviewsListBadge').textContent = reviews.length;

    const listEl = document.getElementById('detailReviewsList');
    if (!listEl) return;

    if (reviews.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state" style="padding: 2.5rem 1.5rem;">
                <p style="font-size: 2rem; margin-bottom: 0.4rem;">💬</p>
                <h4 style="color: var(--text-main); margin-bottom: 0.3rem;">Hələlik bu məhsula rəy yazılmayıb</h4>
                <p style="font-size: 0.85rem;">Sol tərəfdəki formanı dolduraraq ilk rəyi siz yaza bilərsiniz!</p>
            </div>
        `;
        return;
    }

    listEl.innerHTML = reviews.map(r => {
        const name = r.ad || 'Müştəri';
        const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'M';
        const starsCount = Math.min(5, Math.max(1, Number(r.reyting) || 5));
        const starsIcons = '⭐'.repeat(starsCount);

        return `
            <div class="review-item-card">
                <div class="review-item-top">
                    <div class="reviewer-profile">
                        <div class="reviewer-avatar">${escapeHtml(initials)}</div>
                        <div>
                            <span class="reviewer-name">${escapeHtml(name)}</span>
                            <span class="verified-buyer">✔ Təsdiqlənmiş Alıcı</span>
                        </div>
                    </div>
                    <span class="review-stars-badge">${starsIcons} (${starsCount}/5)</span>
                </div>
                <p class="review-comment-text">${escapeHtml(r.sherh || '')}</p>
            </div>
        `;
    }).join('');
}

async function handleReviewSubmit(e) {
    e.preventDefault();

    if (!state.token) {
        showToast('Rəy yazmaq üçün zəhmət olmasa hesabınıza daxil olun! 👤');
        openModal('authModal');
        return;
    }

    const productId = state.activeProductId;
    if (!productId) return;

    const sherhInput = document.getElementById('reviewCommentInput');
    const sherh = sherhInput.value.trim();
    if (!sherh) {
        showToast('Zəhmət olmasa rəy mətnini yazın.');
        return;
    }

    const submitBtn = document.getElementById('submitReviewBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Göndərilir...</span>';

    try {
        const res = await fetch(`/api/products/${productId}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify({
                ad: state.user?.ad || state.user?.email || 'Müştəri',
                reyting: state.reviewRating,
                sherh: sherh
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Rəy əlavə edilmədi');

        sherhInput.value = '';
        showToast('Təşəkkürlər! Rəyiniz uğurla əlavə edildi! ⭐🎉');

        // Yenilənmiş məhsulu alıb dərhal ekranda göstəririk
        await openProductDetail(productId);
    } catch (err) {
        showToast(`Xəta: ${err.message}`);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Rəyi Göndər ⭐</span>';
    }
}

function formatPrice(amount) {
    return Number(amount).toLocaleString('az-AZ') + ' ₼';
}

function toggleWishlist(productId) {
    if (state.wishlist.includes(productId)) {
        state.wishlist = state.wishlist.filter(id => id !== productId);
        showToast('Məhsul bəyənilənlərdən çıxarıldı.');
    } else {
        state.wishlist.push(productId);
        showToast('Məhsul bəyənilənlərə əlavə edildi! ❤️');
    }
    localStorage.setItem('wishlist', JSON.stringify(state.wishlist));
    if (!state.activeProductId) {
        applyFiltersAndRender();
    }
}

function quickAddFeatured() {
    const featured = state.products.find(p => (p.basliq || '').includes('iPhone 16 Pro Max')) || state.products[0];
    if (featured) {
        addToCart(featured._id);
    } else {
        showToast('Məhsul tapılmadı.');
    }
}

// ==================== CART MANAGEMENT ====================
function addToCart(productId) {
    addToCartWithQty(productId, 1);
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(state.cart));
}

function updateCartBadge() {
    const totalCount = state.cart.reduce((sum, item) => sum + item.say, 0);
    const badge = document.getElementById('cartCountBadge');
    if (badge) {
        badge.textContent = totalCount;
        badge.style.display = totalCount > 0 ? 'flex' : 'none';
    }
}

function renderCartModal() {
    const list = document.getElementById('cartItemsList');
    const totalEl = document.getElementById('cartTotalPrice');
    const countEl = document.getElementById('cartModalCount');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (!list) return;

    if (state.cart.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
                <p style="font-size: 2.5rem; margin-bottom: 0.5rem;">🛒</p>
                <p style="font-weight: 600; font-size: 1rem; color: var(--text-main);">Səbətiniz boşdur</p>
                <p style="font-size: 0.85rem; margin-top: 0.2rem;">Kataloqdan zövqünüzə uyğun texnologiya məhsullarını əlavə edin.</p>
            </div>
        `;
        if (totalEl) totalEl.textContent = '0 ₼';
        if (countEl) countEl.textContent = '0 məhsul';
        if (checkoutBtn) checkoutBtn.disabled = true;
        return;
    }

    if (checkoutBtn) checkoutBtn.disabled = false;

    const totalCount = state.cart.reduce((sum, item) => sum + item.say, 0);
    const totalPrice = state.cart.reduce((sum, item) => sum + (item.qiymet * item.say), 0);

    if (countEl) countEl.textContent = `${totalCount} ədəd məhsul`;
    if (totalEl) totalEl.textContent = formatPrice(totalPrice);

    list.innerHTML = state.cart.map(item => `
        <div class="cart-item">
            <img src="${item.sekilUrl || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100'}" alt="${escapeHtml(item.basliq)}" class="cart-item-img" onerror="this.src='https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100'">
            <div class="cart-item-info">
                <div class="cart-item-title">${escapeHtml(item.basliq)}</div>
                <div class="cart-item-price">${formatPrice(item.qiymet)} x ${item.say} = <strong>${formatPrice(item.qiymet * item.say)}</strong></div>
            </div>
            <div class="cart-qty-ctrl">
                <button class="btn-qty" onclick="changeCartQty('${item.id}', -1)">-</button>
                <span style="font-weight:700; font-size:0.85rem; min-width:18px; text-align:center;">${item.say}</span>
                <button class="btn-qty" onclick="changeCartQty('${item.id}', 1)">+</button>
            </div>
            <button class="btn-remove-item" onclick="removeFromCart('${item.id}')" title="Sil">✕</button>
        </div>
    `).join('');
}

function changeCartQty(id, delta) {
    const item = state.cart.find(i => i.id === id);
    if (!item) return;

    item.say += delta;
    if (item.say <= 0) {
        removeFromCart(id);
        return;
    }

    saveCart();
    updateCartBadge();
    renderCartModal();
}

function removeFromCart(id) {
    state.cart = state.cart.filter(i => i.id !== id);
    saveCart();
    updateCartBadge();
    renderCartModal();
    showToast('Məhsul səbətdən silindi.');
}

async function handleCheckout() {
    if (!state.token) {
        showToast('Sifariş üçün əvvəlcə hesabınıza daxil olun!');
        document.getElementById('cartModal').close();
        openModal('authModal');
        return;
    }

    if (state.cart.length === 0) {
        showToast('Səbətiniz boşdur!');
        return;
    }

    const checkoutBtn = document.getElementById('checkoutBtn');
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Sifariş qəbul olunur...';

    const payload = {
        mehsullar: state.cart.map(item => ({
            product: item.id,
            say: item.say,
            qiymet: item.qiymet
        }))
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

        state.cart = [];
        saveCart();
        updateCartBadge();
        document.getElementById('cartModal').close();
        showToast('Təbriklər! Sifarişiniz uğurla qəbul edildi! 🎉📦');
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
            showToast('Qeydiyyat tamamlandı! İndi daxil ola bilərsiniz.');
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
    const adminActionGroup = document.getElementById('adminActionGroup');

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
        if (adminPanelBtn) adminPanelBtn.style.display = isAdmin ? 'inline-flex' : 'none';
        if (adminActionGroup) adminActionGroup.style.display = isAdmin ? 'inline-flex' : 'none';
    } else {
        area.innerHTML = `
            <button id="openAuthBtn" class="btn btn-primary" onclick="openModal('authModal')">
                <span class="icon">👤</span>
                <span class="btn-text">Daxil ol</span>
            </button>
        `;
        myOrdersBtn.style.display = 'none';
        if (adminPanelBtn) adminPanelBtn.style.display = 'none';
        if (adminActionGroup) adminActionGroup.style.display = 'none';
    }
}

// ==================== SEED PRODUCTS (ADMIN) ====================
async function seedSampleProducts() {
    if (!confirm("Bütün məhsullar 10 ədəd real premium elektronika modeli ilə yenilənəcək. Davam edilsin?")) {
        return;
    }

    try {
        showToast('Vitrindəki məhsullar yenilənir...');
        const res = await fetch('/api/products/seed', { method: 'POST' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Seed xətası');

        state.products = data.mehsullar || [];
        applyFiltersAndRender();
        showToast('Məhsullar uğurla yeniləndi və şəkillər yükləndi! 🎉');
    } catch (err) {
        showToast(`Xəta: ${err.message}`);
    }
}

// ==================== ORDERS FETCHING ====================
async function fetchMyOrders() {
    const list = document.getElementById('myOrdersList');
    if (!list) return;

    list.innerHTML = '<div class="spinner"></div>';

    try {
        const res = await fetch('/api/orders/myorders', {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Sifarişlər yüklənmədi');

        if (data.length === 0) {
            list.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:2rem;">Hələlik heç bir sifarişiniz yoxdur.</p>';
            return;
        }

        list.innerHTML = data.map(o => `
            <div class="order-card">
                <div class="order-header-row">
                    <span class="order-id-badge">Sifariş #${o._id.slice(-6).toUpperCase()}</span>
                    <span class="status-pill status-${o.status}">${o.status}</span>
                </div>
                <div style="font-size:0.85rem; margin-bottom:0.4rem; color:var(--text-muted);">
                    Tarix: ${new Date(o.createdAt).toLocaleString('az-AZ')}
                </div>
                <div style="font-size:0.9rem; margin-bottom:0.5rem;">
                    ${(o.mehsullar || []).map(m => `
                        <div>• ${escapeHtml(m.product?.basliq || 'Məhsul')} x ${m.say} (${formatPrice(m.qiymet)})</div>
                    `).join('')}
                </div>
                <div style="text-align:right; font-weight:800; font-size:1.05rem; color:var(--primary);">
                    Yekun: ${formatPrice(o.umumiQiymet)}
                </div>
            </div>
        `).join('');
    } catch (err) {
        list.innerHTML = `<p class="alert alert-danger">${escapeHtml(err.message)}</p>`;
    }
}

async function fetchAdminOrders() {
    const list = document.getElementById('adminOrdersList');
    if (!list) return;

    list.innerHTML = '<div class="spinner"></div>';

    try {
        const res = await fetch('/api/orders', {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Sifarişlər yüklənmədi');

        if (data.length === 0) {
            list.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:2rem;">Heç bir sifariş tapılmadı.</p>';
            return;
        }

        list.innerHTML = data.map(o => `
            <div class="order-card">
                <div class="order-header-row">
                    <div>
                        <span class="order-id-badge">Sifariş #${o._id.slice(-6).toUpperCase()}</span>
                        <span style="margin-left:0.5rem; font-size:0.8rem; color:var(--text-dim);">
                            Müştəri: <strong>${escapeHtml(o.user?.ad || o.user?.email || 'Naməlum')}</strong>
                        </span>
                    </div>
                    <select class="form-input" style="width:auto; padding:0.25rem 0.6rem; font-size:0.8rem;" onchange="changeOrderStatus('${o._id}', this.value)">
                        <option value="Gözləyir" ${o.status === 'Gözləyir' ? 'selected' : ''}>⏳ Gözləyir</option>
                        <option value="Çatdırılır" ${o.status === 'Çatdırılır' ? 'selected' : ''}>🚚 Çatdırılır</option>
                        <option value="Tamamlandı" ${o.status === 'Tamamlandı' ? 'selected' : ''}>✅ Tamamlandı</option>
                    </select>
                </div>
                <div style="font-size:0.85rem; margin-bottom:0.4rem;">
                    ${(o.mehsullar || []).map(m => `
                        <div>• ${escapeHtml(m.product?.basliq || 'Məhsul')} x ${m.say} (${formatPrice(m.qiymet)})</div>
                    `).join('')}
                </div>
                <div style="text-align:right; font-weight:800; color:var(--primary);">
                    Yekun: ${formatPrice(o.umumiQiymet)}
                </div>
            </div>
        `).join('');
    } catch (err) {
        list.innerHTML = `<p class="alert alert-danger">${escapeHtml(err.message)}</p>`;
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
        if (!res.ok) throw new Error(data.message || 'Status dəyişmədi');
        showToast('Sifarişin statusu yeniləndi! ✅');
    } catch (err) {
        showToast(`Xəta: ${err.message}`);
    }
}

async function handleAddProductSubmit(e) {
    e.preventDefault();
    const basliq = document.getElementById('prodTitle').value.trim();
    const tesvir = document.getElementById('prodDesc').value.trim();
    const sekilUrl = document.getElementById('prodImage').value.trim();
    const qiymet = Number(document.getElementById('prodPrice').value);
    const kategoriya = document.getElementById('prodCategory').value;

    try {
        const res = await fetch('/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify({ basliq, tesvir, sekilUrl, qiymet, kategoriya, reyting: 5 })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Məhsul əlavə edilmədi');

        document.getElementById('addProductModal').close();
        document.getElementById('addProductForm').reset();
        showToast('Yeni məhsul uğurla əlavə edildi! 🎉');
        fetchProducts();
    } catch (err) {
        showToast(`Xəta: ${err.message}`);
    }
}

// ==================== MODAL UTILITIES (Modern Web Guidance) ====================
function openModal(id) {
    const dialog = document.getElementById(id);
    if (dialog && typeof dialog.showModal === 'function') {
        dialog.showModal();
    }
}

function setupModalsLightDismiss() {
    if (!('closedBy' in HTMLDialogElement.prototype)) {
        document.querySelectorAll('dialog').forEach(dialog => {
            dialog.addEventListener('click', (event) => {
                if (event.target !== dialog) return;
                const rect = dialog.getBoundingClientRect();
                const isDialogContent = (
                    rect.top <= event.clientY &&
                    event.clientY <= rect.top + rect.height &&
                    rect.left <= event.clientX &&
                    event.clientX <= rect.left + rect.width
                );
                if (isDialogContent) return;
                dialog.close();
            });
        });
    }
}

function showToast(msg) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 400);
    }, 3200);
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
