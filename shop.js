// shop.js - Интернет-магазин MA Furniture
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    console.log('Initializing MA Furniture Shop...');
    initializeProducts();
    initializeCart();
    initializeMobileMenu();
    
    window.addEventListener('productsUpdated', (event) => {
        console.log('Товары обновлены через кастомное событие');
        if (typeof initializeProducts === 'function') {
            initializeProducts();
        }
    });
}

// Система корзины
class CartSystem {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('ma_furniture_cart')) || [];
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateCartUI();
    }
    
    bindEvents() {
        // Открытие/закрытие корзины
        const cartIcon = document.getElementById('cartIcon');
        const cartClose = document.getElementById('cartClose');
        const continueShoppingBtn = document.getElementById('continueShoppingBtn');
        const checkoutBtn = document.getElementById('checkoutBtn');
        const cartOverlay = document.getElementById('cartOverlay');
        
        if (cartIcon) {
            cartIcon.addEventListener('click', () => this.openCart());
        }
        
        if (cartClose) {
            cartClose.addEventListener('click', () => this.closeCart());
        }
        
        if (continueShoppingBtn) {
            continueShoppingBtn.addEventListener('click', () => this.closeCart());
        }
        
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.checkout());
        }
        
        if (cartOverlay) {
            cartOverlay.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) this.closeCart();
            });
        }
        
        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('cartOverlay')?.classList.contains('active')) {
                this.closeCart();
            }
        });
    }
    
    openCart() {
        console.log('Opening cart...');
        const overlay = document.getElementById('cartOverlay');
        if (overlay) {
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            this.renderCart();
        } else {
            console.error('Cart overlay not found!');
        }
    }
    
    closeCart() {
        console.log('Closing cart...');
        const overlay = document.getElementById('cartOverlay');
        if (overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
    
    addToCart(product) {
        const existingItem = this.cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.images?.[0] || '',
                quantity: 1
            });
        }
        
        this.saveCart();
        this.updateCartUI();
        this.showAddToCartAnimation();
        this.showNotification(`"${product.name}" добавлен в корзину`, 'success');
    }
    
    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartUI();
        this.renderCart();
        this.showNotification('Товар удален из корзины', 'success');
    }
    
    updateQuantity(productId, change) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            item.quantity += change;
            
            if (item.quantity < 1) {
                this.removeFromCart(productId);
                return;
            }
            
            if (item.quantity > 99) {
                item.quantity = 99;
                this.showNotification('Максимальное количество товара - 99 шт.', 'error');
            }
            
            this.saveCart();
            this.updateCartUI();
            this.renderCart();
        }
    }
    
    setQuantity(productId, quantity) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            if (quantity < 1) {
                this.removeFromCart(productId);
                return;
            }
            
            if (quantity > 99) {
                quantity = 99;
                this.showNotification('Максимальное количество товара - 99 шт.', 'error');
            }
            
            item.quantity = quantity;
            this.saveCart();
            this.updateCartUI();
            this.renderCart();
        }
    }
    
    saveCart() {
        localStorage.setItem('ma_furniture_cart', JSON.stringify(this.cart));
    }
    
    updateCartUI() {
        const cartIcon = document.getElementById('cartIcon');
        const cartCount = document.getElementById('cartCount');
        
        if (cartCount) {
            const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
            
            if (totalItems > 0) {
                cartCount.classList.add('show');
                // Добавляем анимацию при обновлении
                cartCount.style.animation = 'none';
                setTimeout(() => {
                    cartCount.style.animation = 'cartBounce 0.5s ease';
                }, 10);
            } else {
                cartCount.classList.remove('show');
            }
        }
        
        // Обновляем состояние корзины если она открыта
        if (document.getElementById('cartOverlay')?.classList.contains('active')) {
            this.renderCart();
        }
    }
    
    renderCart() {
        const cartItems = document.getElementById('cartItems');
        const cartEmpty = document.getElementById('cartEmpty');
        const cartFooter = document.getElementById('cartFooter');
        const cartTotalAmount = document.getElementById('cartTotalAmount');
        
        if (!cartItems || !cartEmpty || !cartFooter) {
            console.error('Cart elements not found!');
            return;
        }
        
        if (this.cart.length === 0) {
            cartItems.style.display = 'none';
            cartEmpty.style.display = 'block';
            cartFooter.style.display = 'none';
            return;
        }
        
        cartEmpty.style.display = 'none';
        cartItems.style.display = 'block';
        cartFooter.style.display = 'block';
        
        let total = 0;
        let itemsHTML = '';
        
        this.cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            const imageHTML = item.image ? 
                `<img src="${item.image}" alt="${item.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` :
                '';
            
            itemsHTML += `
                <div class="cart-item" data-id="${item.id}">
                    <div class="cart-item-image">
                        ${imageHTML}
                        <div class="image-placeholder" style="${item.image ? 'display: none;' : ''}">
                            <i class="fas fa-couch"></i>
                        </div>
                    </div>
                    <div class="cart-item-details">
                        <h4 class="cart-item-name">${item.name}</h4>
                        <div class="cart-item-price">${this.formatPrice(item.price)}</div>
                        <div class="cart-item-actions">
                            <div class="quantity-controls">
                                <button class="quantity-btn decrease-btn" onclick="cartSystem.updateQuantity(${item.id}, -1)">
                                    <i class="fas fa-minus"></i>
                                </button>
                                <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="99" 
                                       onchange="cartSystem.setQuantity(${item.id}, parseInt(this.value))">
                                <button class="quantity-btn increase-btn" onclick="cartSystem.updateQuantity(${item.id}, 1)">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                            <button class="remove-item" onclick="cartSystem.removeFromCart(${item.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        cartItems.innerHTML = itemsHTML;
        
        if (cartTotalAmount) {
            cartTotalAmount.textContent = this.formatPrice(total);
        }
        
        // Обновляем состояние кнопки оформления заказа
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.disabled = this.cart.length === 0;
        }
    }
    
    checkout() {
        if (this.cart.length === 0) {
            this.showNotification('Корзина пуста', 'error');
            return;
        }
        
        let message = '🛒 НОВЫЙ ЗАКАЗ MA FURNITURE\n\n';
        let total = 0;
        
        this.cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            message += `${index + 1}. ${item.name}\n`;
            message += `   Количество: ${item.quantity} шт.\n`;
            message += `   Цена за шт: ${this.formatPrice(item.price)}\n`;
            message += `   Сумма: ${this.formatPrice(itemTotal)}\n\n`;
        });
        
        message += `💰 ОБЩАЯ СУММА: ${this.formatPrice(total)}\n\n`;
        message += `📅 ${new Date().toLocaleString('ru-RU')}`;
        
        const encodedMessage = encodeURIComponent(message);
        const telegramUrl = `https://t.me/Ma_Furniture_ru?text=${encodedMessage}`;
        
        window.open(telegramUrl, '_blank');
        
        // Очищаем корзину после оформления
        this.cart = [];
        this.saveCart();
        this.updateCartUI();
        this.renderCart();
        this.closeCart();
        
        this.showNotification('Заказ оформлен! Свяжитесь с нами в Telegram для подтверждения.', 'success');
    }
    
    clearCart() {
        this.cart = [];
        this.saveCart();
        this.updateCartUI();
        this.renderCart();
        this.showNotification('Корзина очищена', 'success');
    }
    
    getCartTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }
    
    getCartItemsCount() {
        return this.cart.reduce((count, item) => count + item.quantity, 0);
    }
    
    showAddToCartAnimation() {
        const cartIcon = document.getElementById('cartIcon');
        if (cartIcon) {
            cartIcon.classList.add('animate');
            setTimeout(() => cartIcon.classList.remove('animate'), 500);
        }
    }
    
    showNotification(message, type = 'success') {
        // Удаляем существующие уведомления
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());
        
        // Создаем новое уведомление
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle"></i>
                ${message}
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Показываем уведомление
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Скрываем через 3 секунды
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0
        }).format(price);
    }
}

// Глобальная переменная для корзины
let cartSystem;

function initializeCart() {
    cartSystem = new CartSystem();
    console.log('Cart system initialized');
}

// Products functionality
function initializeProducts() {
    const productsGrid = document.getElementById('productsGrid');
    const pagination = document.getElementById('pagination');
    const itemsPerPage = 15;
    let currentPage = 1;
    let currentFilter = 'all';

    function getActiveProducts() {
        return dataSync.getActiveProducts();
    }

    function renderProducts() {
        const activeProducts = getActiveProducts();
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        
        let filteredProducts = activeProducts;
        if (currentFilter !== 'all') {
            filteredProducts = activeProducts.filter(product => 
                product.section === currentFilter || product.category === currentFilter
            );
        }
        
        const productsToShow = filteredProducts.slice(startIndex, endIndex);
        
        if (productsGrid) {
            productsGrid.innerHTML = '';
            
            if (productsToShow.length === 0) {
                productsGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #666;">
                        <i class="fas fa-box-open" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                        <h3>Товары не найдены</h3>
                        <p>${activeProducts.length === 0 ? 'Нет активных товаров' : 'Нет товаров в выбранной категории'}</p>
                    </div>
                `;
                if (pagination) pagination.innerHTML = '';
                return;
            }
            
            productsToShow.forEach(product => {
                const productCard = createProductCard(product);
                productsGrid.appendChild(productCard);
            });
        }
        
        if (pagination) {
            renderPagination(filteredProducts.length);
        }
        attachProductEventListeners();
    }

    function createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.category = product.category;
        card.dataset.section = product.section || 'all';
        
        const badge = product.badge ? `<div class="product-badge">${product.badge}</div>` : '';
        
        let imageContent = '';
        if (product.images && product.images.length > 0) {
            imageContent = `<img src="${product.images[0]}" alt="${product.name}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
        }
        
        const fallbackContent = `
            <div style="width: 100%; height: 100%; background: #f0f0f0; display: ${product.images && product.images.length > 0 ? 'none' : 'flex'}; align-items: center; justify-content: center; color: #666; font-size: 1.2rem;">
                ${product.name}
            </div>
        `;
        
        const productUrl = `piece.html?id=${product.id}`;
        
        card.innerHTML = `
            <div class="product-image">
                ${imageContent}
                ${fallbackContent}
                ${badge}
                <a href="${productUrl}" class="product-link" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1;"></a>
            </div>
            <div class="product-info">
                <h3 class="product-title">
                    <a href="${productUrl}" style="color: inherit; text-decoration: none;">${product.name}</a>
                </h3>
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
                    <button class="btn btn-primary add-to-cart-btn" data-product='${JSON.stringify(product).replace(/'/g, "&apos;")}'>
                        <i class="fas fa-shopping-cart"></i>
                        В корзину
                    </button>
                    <button class="btn-wishlist">
                        <i class="far fa-heart"></i>
                    </button>
                    <a href="${productUrl}" class="btn btn-outline" style="margin-left: auto;">
                        <i class="fas fa-external-link-alt"></i>
                    </a>
                </div>
            </div>
        `;
        
        return card;
    }

    function renderPagination(totalItems) {
        const totalFilteredPages = Math.ceil(totalItems / itemsPerPage);
        
        if (pagination) {
            pagination.innerHTML = '';
            
            if (totalFilteredPages <= 1) return;
            
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
    }

    function attachProductEventListeners() {
        // Add to cart buttons
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const productData = JSON.parse(e.target.closest('.add-to-cart-btn').dataset.product.replace(/&apos;/g, "'"));
                cartSystem.addToCart(productData);
            });
        });
        
        // Wishlist buttons
        document.querySelectorAll('.btn-wishlist').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const icon = e.target.closest('button').querySelector('i');
                icon.classList.toggle('far');
                icon.classList.toggle('fas');
                
                if (icon.classList.contains('fas')) {
                    icon.style.color = '#d4af37';
                    showNotification('Товар добавлен в избранное');
                } else {
                    icon.style.color = '';
                    showNotification('Товар удален из избранного');
                }
            });
        });
    }

    // Initialize filters from existing HTML
    function initializeFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                currentFilter = filter;
                currentPage = 1;
                renderProducts();
            });
        });
    }

    function handleUrlFilters() {
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category');
        
        if (category) {
            const filterBtn = document.querySelector(`[data-filter="${category}"]`);
            if (filterBtn) {
                filterBtn.click();
            }
        }
    }

    // Initialize filters and render products
    initializeFilters();
    renderProducts();
    handleUrlFilters();
}

function initializeMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.querySelector('.main-nav');
    
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
    }
    
    document.querySelectorAll('.main-nav a').forEach(link => {
        link.addEventListener('click', () => {
            if (mainNav) mainNav.classList.remove('active');
            if (menuToggle) menuToggle.classList.remove('active');
        });
    });
}

function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0
    }).format(price);
}

function showNotification(message, type = 'success') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle"></i>
            ${message}
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Глобальные функции для доступа из HTML
window.formatPrice = formatPrice;
window.showNotification = showNotification;