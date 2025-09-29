// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Listen for products updates from admin panel
window.addEventListener('message', function(event) {
    if (event.data.type === 'PRODUCTS_UPDATED') {
        // Перезагружаем товары при обновлении из админки
        if (window.productsGrid) {
            loadProducts();
        }
    }
});

function initializeApp() {
    // Initialize products and pagination
    initializeProducts();
    
    // Initialize cart
    initializeCart();
    
    // Initialize filters
    initializeFilters();
    
    // Initialize modal
    initializeModal();
    
    // Initialize mobile menu
    initializeMobileMenu();
}

// Products data - будет загружаться из localStorage
let productsData = [];

// Products and pagination functionality
function initializeProducts() {
    const productsGrid = document.getElementById('productsGrid');
    const pagination = document.getElementById('pagination');
    const itemsPerPage = 15;
    let currentPage = 1;
    let currentFilter = 'all';

    // Получаем активные товары из localStorage
    function getActiveProducts() {
        let products = [];
        
        try {
            products = JSON.parse(localStorage.getItem('products')) || [];
        } catch (error) {
            console.error('Load products error:', error);
            products = [];
        }
        
        // Если нет товаров в localStorage, создаем начальные данные
        if (products.length === 0) {
            products = [
                { id: 1, name: "Пантограф Classic Gold", price: 45990, category: "pantograph", badge: "Хит продаж", active: true },
                { id: 2, name: "Пантограф Modern Silver", price: 32990, category: "pantograph", active: true },
                { id: 3, name: "Гардеробная система Lux", price: 89990, category: "wardrobe", badge: "Новинка", active: true },
                { id: 4, name: "Премиум гарнитур Imperial", price: 125990, category: "premium", active: true },
                { id: 5, name: "Гардеробная система Comfort", price: 75990, category: "wardrobe", active: true },
                { id: 6, name: "Пантограф Elegance", price: 56990, category: "pantograph", active: true },
                { id: 7, name: "Премиум комплект Royal", price: 98990, category: "premium", badge: "Хит продаж", active: true },
                { id: 8, name: "Пантограф Minimal", price: 42990, category: "pantograph", active: true },
                { id: 9, name: "Гардеробная система Smart", price: 67990, category: "wardrobe", active: true },
                { id: 10, name: "Премиум набор Prestige", price: 112990, category: "premium", active: true },
                { id: 11, name: "Пантограф Compact", price: 38990, category: "pantograph", active: true },
                { id: 12, name: "Гардеробная система Pro", price: 82990, category: "wardrobe", badge: "Новинка", active: true },
                { id: 13, name: "Премиум коллекция Elite", price: 95990, category: "premium", active: true },
                { id: 14, name: "Пантограф Standard", price: 49990, category: "pantograph", active: true },
                { id: 15, name: "Гардеробная система Basic", price: 72990, category: "wardrobe", active: true }
            ];
            
            try {
                localStorage.setItem('products', JSON.stringify(products));
            } catch (error) {
                console.error('Save default products error:', error);
            }
        }
        
        // Фильтруем только активные товары
        return products.filter(product => product.active === true);
    }

    // Render products for current page and filter
    function renderProducts() {
        const activeProducts = getActiveProducts();
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        
        let filteredProducts = activeProducts;
        if (currentFilter !== 'all') {
            filteredProducts = activeProducts.filter(product => product.category === currentFilter);
        }
        
        const productsToShow = filteredProducts.slice(startIndex, endIndex);
        
        productsGrid.innerHTML = '';
        
        if (productsToShow.length === 0) {
            productsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #666;">
                    <i class="fas fa-box-open" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <h3>Товары не найдены</h3>
                    <p>${activeProducts.length === 0 ? 'Нет активных товаров' : 'Нет товаров в выбранной категории'}</p>
                </div>
            `;
            pagination.innerHTML = '';
            return;
        }
        
        productsToShow.forEach(product => {
            const productCard = createProductCard(product);
            productsGrid.appendChild(productCard);
        });
        
        renderPagination(filteredProducts.length);
        attachProductEventListeners();
    }

    // Create product card HTML
    function createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.category = product.category;
        
        const badge = product.badge ? `<div class="product-badge">${product.badge}</div>` : '';
        
        card.innerHTML = `
            <div class="product-image">
                <div style="width: 100%; height: 100%; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #666; font-size: 1.2rem;">
                    ${product.name}
                </div>
                ${badge}
                <button class="quick-view" data-product="${product.id}">Быстрый просмотр</button>
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <div class="product-rating">
                    <div class="stars">
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                    </div>
                    <span class="rating-count">(${Math.floor(Math.random() * 20) + 5} отзывов)</span>
                </div>
                <div class="product-price">
                    <span class="current-price">${formatPrice(product.price)}</span>
                </div>
                <div class="product-actions">
                    <button class="btn btn-cart" data-product="${product.id}">В корзину</button>
                    <button class="btn-wishlist">
                        <i class="far fa-heart"></i>
                    </button>
                </div>
            </div>
        `;
        
        return card;
    }

    // Render pagination
    function renderPagination(totalItems) {
        const totalFilteredPages = Math.ceil(totalItems / itemsPerPage);
        
        pagination.innerHTML = '';
        
        if (totalFilteredPages <= 1) return;
        
        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.className = `page-btn ${currentPage === 1 ? 'disabled' : ''}`;
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderProducts();
            }
        });
        pagination.appendChild(prevBtn);
        
        // Page buttons
        for (let i = 1; i <= totalFilteredPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                renderProducts();
            });
            pagination.appendChild(pageBtn);
        }
        
        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.className = `page-btn ${currentPage === totalFilteredPages ? 'disabled' : ''}`;
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalFilteredPages) {
                currentPage++;
                renderProducts();
            }
        });
        pagination.appendChild(nextBtn);
    }

    // Attach event listeners to product buttons
    function attachProductEventListeners() {
        // Add to cart buttons
        document.querySelectorAll('.btn-cart').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = parseInt(e.target.dataset.product);
                addToCart(productId);
                
                // Анимация добавления в корзину
                const productCard = e.target.closest('.product-card');
                productCard.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    productCard.style.transform = '';
                }, 300);
            });
        });
        
        // Quick view buttons
        document.querySelectorAll('.quick-view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = parseInt(e.target.dataset.product);
                showProductModal(productId);
            });
        });
        
        // Wishlist buttons
        document.querySelectorAll('.btn-wishlist').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.classList.toggle('far');
                e.target.classList.toggle('fas');
                e.target.classList.toggle('active');
                
                // Анимация добавления в избранное
                if (e.target.classList.contains('fas')) {
                    e.target.style.color = '#d4af37';
                    showNotification('Товар добавлен в избранное');
                } else {
                    e.target.style.color = '';
                }
            });
        });
    }

    // Initialize filters
    function initializeFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active filter
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update current filter and reset to page 1
                currentFilter = btn.dataset.filter;
                currentPage = 1;
                
                // Re-render products
                renderProducts();
            });
        });
    }

    // Load products function for external calls
    window.loadProducts = renderProducts;

    // Initial render
    renderProducts();
}

// Cart functionality
function initializeCart() {
    const cartBtn = document.getElementById('cartBtn');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartClose = document.getElementById('cartClose');
    const cartItems = document.querySelector('.cart-items');
    const cartCount = document.querySelector('.cart-count');
    const totalPrice = document.querySelector('.total-price');
    const checkoutBtn = document.querySelector('.btn-checkout');
    
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Update cart display
    function updateCartDisplay() {
        cartItems.innerHTML = '';
        
        if (cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart" style="font-size: 3rem; color: #ddd; margin-bottom: 1rem;"></i>
                    <p style="text-align: center; color: #666;">Корзина пуста</p>
                </div>
            `;
            cartCount.textContent = '0';
            totalPrice.textContent = '0 ₽';
            checkoutBtn.disabled = true;
            checkoutBtn.style.opacity = '0.6';
            return;
        }
        
        checkoutBtn.disabled = false;
        checkoutBtn.style.opacity = '1';
        
        let total = 0;
        
        cart.forEach(item => {
            const product = getActiveProducts().find(p => p.id === item.id);
            if (!product) {
                // Если товар больше не активен, удаляем его из корзины
                removeFromCart(item.id);
                return;
            }
            
            const itemTotal = product.price * item.quantity;
            total += itemTotal;
            
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="cart-item-info">
                    <h4>${product.name}</h4>
                    <p>${formatPrice(product.price)} × ${item.quantity} = ${formatPrice(itemTotal)}</p>
                </div>
                <div class="cart-item-actions">
                    <button class="quantity-btn minus" data-id="${product.id}">-</button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="quantity-btn plus" data-id="${product.id}">+</button>
                    <button class="remove-btn" data-id="${product.id}" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            cartItems.appendChild(cartItem);
        });
        
        cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
        totalPrice.textContent = formatPrice(total);
        
        attachCartEventListeners();
    }
    
    // Attach event listeners to cart items
    function attachCartEventListeners() {
        // Quantity minus buttons
        document.querySelectorAll('.quantity-btn.minus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = parseInt(e.target.dataset.id);
                updateCartQuantity(productId, -1);
            });
        });
        
        // Quantity plus buttons
        document.querySelectorAll('.quantity-btn.plus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = parseInt(e.target.dataset.id);
                updateCartQuantity(productId, 1);
            });
        });
        
        // Remove buttons
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = parseInt(e.target.closest('.remove-btn').dataset.id);
                removeFromCart(productId);
            });
        });
    }
    
    // Get active products for cart
    function getActiveProducts() {
        let products = [];
        
        try {
            products = JSON.parse(localStorage.getItem('products')) || [];
        } catch (error) {
            console.error('Load products error:', error);
            products = [];
        }
        
        return products.filter(product => product.active === true);
    }
    
    // Add product to cart
    function addToCart(productId) {
        const product = getActiveProducts().find(p => p.id === productId);
        if (!product) {
            showNotification('Товар недоступен', 'error');
            return;
        }
        
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ id: productId, quantity: 1 });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
        
        // Show notification
        showNotification(`${product.name} добавлен в корзину`);
        
        // Show cart sidebar
        cartSidebar.classList.add('active');
    }
    
    // Update cart quantity
    function updateCartQuantity(productId, change) {
        const item = cart.find(item => item.id === productId);
        
        if (item) {
            item.quantity += change;
            
            if (item.quantity <= 0) {
                removeFromCart(productId);
                return;
            }
            
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartDisplay();
        }
    }
    
    // Remove product from cart
    function removeFromCart(productId) {
        const product = getActiveProducts().find(p => p.id === productId);
        cart = cart.filter(item => item.id !== productId);
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
        
        if (product) {
            showNotification(`${product.name} удален из корзины`);
        }
    }
    
    // Clear cart
    function clearCart() {
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
    }
    
    // Event listeners
    cartBtn.addEventListener('click', () => {
        cartSidebar.classList.add('active');
    });
    
    cartClose.addEventListener('click', () => {
        cartSidebar.classList.remove('active');
    });
    
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            showNotification('Корзина пуста', 'error');
            return;
        }
        
        const total = cart.reduce((sum, item) => {
            const product = getActiveProducts().find(p => p.id === item.id);
            return sum + (product ? product.price * item.quantity : 0);
        }, 0);
        
        // Здесь можно добавить логику оформления заказа
        showNotification(`Заказ оформлен! Сумма: ${formatPrice(total)}`, 'success');
        clearCart();
        cartSidebar.classList.remove('active');
    });
    
    // Close cart when clicking outside
    document.addEventListener('click', (e) => {
        if (cartSidebar.classList.contains('active') && 
            !cartSidebar.contains(e.target) && 
            !cartBtn.contains(e.target)) {
            cartSidebar.classList.remove('active');
        }
    });
    
    // Initial cart display
    updateCartDisplay();
}

// Modal functionality
function initializeModal() {
    const modal = document.getElementById('quickViewModal');
    const modalClose = document.getElementById('modalClose');
    
    modalClose.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}

// Show product modal
function showProductModal(productId) {
    const modal = document.getElementById('quickViewModal');
    const modalBody = document.querySelector('.modal-body');
    const product = getActiveProducts().find(p => p.id === productId);
    
    if (!product) {
        showNotification('Товар недоступен', 'error');
        return;
    }
    
    modalBody.innerHTML = `
        <div class="modal-product">
            <div class="modal-product-image">
                <div style="width: 100%; height: 300px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #666; font-size: 1.5rem;">
                    ${product.name}
                </div>
            </div>
            <div class="modal-product-info">
                <h2>${product.name}</h2>
                <div class="modal-product-price">
                    <span class="current-price">${formatPrice(product.price)}</span>
                </div>
                <div class="modal-product-description">
                    <p>Элитный ${product.category === 'pantograph' ? 'пантограф' : product.category === 'wardrobe' ? 'гардероб' : 'мебельный гарнитур'} премиум-класса. Изготовлен из высококачественных материалов с вниманием к деталям.</p>
                    <ul>
                        <li>Премиальные материалы</li>
                        <li>Эксклюзивный дизайн</li>
                        <li>Долговечность и надежность</li>
                        <li>Легкость в уходе</li>
                    </ul>
                </div>
                <div class="modal-product-actions">
                    <button class="btn btn-primary btn-add-to-cart" data-product="${product.id}">
                        <i class="fas fa-shopping-cart"></i> Добавить в корзину
                    </button>
                    <button class="btn btn-outline btn-wishlist-modal">
                        <i class="far fa-heart"></i> В избранное
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add event listener to modal add to cart button
    const addToCartBtn = modalBody.querySelector('.btn-add-to-cart');
    addToCartBtn.addEventListener('click', () => {
        addToCart(product.id);
        modal.classList.remove('active');
    });
    
    // Add event listener to modal wishlist button
    const wishlistBtn = modalBody.querySelector('.btn-wishlist-modal');
    wishlistBtn.addEventListener('click', () => {
        wishlistBtn.querySelector('i').classList.toggle('far');
        wishlistBtn.querySelector('i').classList.toggle('fas');
        
        if (wishlistBtn.querySelector('i').classList.contains('fas')) {
            wishlistBtn.style.color = '#d4af37';
            showNotification('Товар добавлен в избранное');
        } else {
            wishlistBtn.style.color = '';
        }
    });
    
    modal.classList.add('active');
}

// Mobile menu functionality
function initializeMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.querySelector('.main-nav');
    
    menuToggle.addEventListener('click', () => {
        mainNav.classList.toggle('active');
        menuToggle.classList.toggle('active');
    });
}

// Utility functions
function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

function showNotification(message, type = 'success') {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// Get active products function for external use
function getActiveProducts() {
    let products = [];
    
    try {
        products = JSON.parse(localStorage.getItem('products')) || [];
    } catch (error) {
        console.error('Load products error:', error);
        products = [];
    }
    
    return products.filter(product => product.active === true);
}