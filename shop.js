document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    console.log('Initializing MA Furniture Shop...');
    initializeProducts();
    initializeCart();
    initializeMobileMenu();
    
    window.addEventListener('productsDataUpdated', () => {
        console.log('Shop: Данные товаров обновлены');
        initializeProducts();
    });
    
    // Слушаем обновления разделов из админки
    window.addEventListener('adminSectionsUpdated', () => {
        console.log('Shop: Разделы обновлены');
        initializeProducts();
    });
}

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
                this.showNotification('Максимум 99 шт.', 'error');
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
                this.showNotification('Максимум 99 шт.', 'error');
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
                cartCount.style.animation = 'none';
                setTimeout(() => {
                    cartCount.style.animation = 'cartBounce 0.5s ease';
                }, 10);
            } else {
                cartCount.classList.remove('show');
            }
        }
        
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
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());
        
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
    
    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0
        }).format(price);
    }
}

let cartSystem;

function initializeCart() {
    cartSystem = new CartSystem();
    console.log('Cart system initialized');
}

function initializeProducts() {
    const productsGrid = document.getElementById('productsGrid');
    const pagination = document.getElementById('pagination');
    const itemsPerPage = 15;
    let currentPage = 1;
    let currentFilter = 'all';

    function renderProducts() {
        let activeProducts = dataManager.getActiveProducts();
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        
        let filteredProducts = activeProducts;
        if (currentFilter !== 'all') {
            filteredProducts = activeProducts.filter(product => 
                product.section === currentFilter
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
                        <p>${activeProducts.length === 0 ? 'Нет активных товаров' : 'Нет товаров в выбранном разделе'}</p>
                        ${activeProducts.length === 0 ? 
                            '<p><a href="admin/admin-login.html" style="color: #d4af37;">Добавьте товары в админ-панели</a></p>' : 
                            ''
                        }
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
        card.dataset.section = product.section || 'all';
        
        // Бейдж
        let badgeClass = '';
        if (product.badge) {
            switch(product.badge.toLowerCase()) {
                case 'хит продаж':
                case 'хит':
                    badgeClass = 'hit';
                    break;
                case 'новинка':
                case 'new':
                    badgeClass = 'new';
                    break;
                case 'акция':
                case 'sale':
                    badgeClass = 'sale';
                    break;
                case 'эксклюзив':
                case 'exclusive':
                    badgeClass = 'exclusive';
                    break;
                case 'премиум':
                case 'premium':
                    badgeClass = 'premium';
                    break;
                default:
                    badgeClass = 'new';
            }
        }
        
        const badge = product.badge ? 
            `<div class="product-badge ${badgeClass}">${product.badge}</div>` : '';
        
        // Берем первое изображение из массива (если есть)
        let imageContent = '';
        if (product.images && product.images.length > 0) {
            imageContent = `<img src="${product.images[0]}" alt="${product.name}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
        }
        
        const productUrl = `piece.html?id=${product.id}`;
        
        card.innerHTML = `
            <div class="product-image">
                ${imageContent}
                <div class="image-placeholder" style="${product.images && product.images.length > 0 ? 'display: none;' : 'display: flex;'}">
                    <i class="fas fa-couch"></i>
                </div>
                ${badge}
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <div class="product-description">
                    ${product.description || 'Качественный товар от MA Furniture'}
                </div>
                <div class="product-price">
                    <span class="current-price">${formatPrice(product.price)}</span>
                </div>
                <div class="product-actions">
                    <button class="btn btn-primary add-to-cart-btn" data-product-id="${product.id}">
                        <i class="fas fa-shopping-cart"></i>
                        В корзину
                    </button>
                </div>
            </div>
            <a href="${productUrl}" class="product-link-overlay"></a>
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
        // Обработчик для кнопки "В корзину"
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation(); // Предотвращаем переход по ссылке
                const productId = parseInt(e.target.closest('.add-to-cart-btn').dataset.productId);
                const product = dataManager.getProductById(productId);
                if (product && cartSystem) {
                    cartSystem.addToCart(product);
                }
            });
        });
        
        // Обработчик для всей карточки (кроме кнопки корзины)
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Если клик был по кнопке корзины - не переходим на страницу товара
                if (e.target.closest('.add-to-cart-btn')) {
                    return;
                }
                
                // Находим ссылку внутри карточки и переходим по ней
                const link = card.querySelector('.product-link-overlay');
                if (link) {
                    window.location.href = link.href;
                }
            });
        });
        
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
                    showNotification('Товар удален из избранное');
                }
            });
        });
    }

    function loadSectionsFromAdmin() {
        try {
            const adminSections = JSON.parse(localStorage.getItem('adminSections')) || [];
            const activeSections = adminSections.filter(section => section.active);
            
            return activeSections;
        } catch (error) {
            console.error('Error loading sections from admin:', error);
            return [];
        }
    }

    function initializeFilters() {
        const catalogFilters = document.getElementById('catalogFilters');
        const footerSections = document.getElementById('footerSections');
        
        if (!catalogFilters || !footerSections) return;
        
        // Загружаем разделы из админки
        const sections = loadSectionsFromAdmin();
        
        // Очищаем контейнеры
        catalogFilters.innerHTML = '<button class="filter-btn active" data-filter="all">Все товары</button>';
        footerSections.innerHTML = '';
        
        // Добавляем обработчик для фильтра "Все товары"
        const allFilterBtn = catalogFilters.querySelector('[data-filter="all"]');
        allFilterBtn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            allFilterBtn.classList.add('active');
            
            currentFilter = 'all';
            currentPage = 1;
            renderProducts();
        });
        
        // Добавляем фильтры для активных разделов
        sections.forEach(section => {
            // Фильтры в каталоге
            const filterBtn = document.createElement('button');
            filterBtn.className = 'filter-btn';
            filterBtn.dataset.filter = section.code;
            filterBtn.textContent = section.name;
            filterBtn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                filterBtn.classList.add('active');
                
                currentFilter = section.code;
                currentPage = 1;
                renderProducts();
            });
            catalogFilters.appendChild(filterBtn);
            
            // Ссылки в футере
            const footerLink = document.createElement('li');
            const link = document.createElement('a');
            link.href = `shop.html?section=${section.code}`;
            link.textContent = section.name;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const filterBtn = document.querySelector(`[data-filter="${section.code}"]`);
                if (filterBtn) {
                    filterBtn.click();
                    window.scrollTo({ top: document.getElementById('catalog').offsetTop - 100, behavior: 'smooth' });
                }
            });
            footerLink.appendChild(link);
            footerSections.appendChild(footerLink);
        });
    }

    function handleUrlFilters() {
        const urlParams = new URLSearchParams(window.location.search);
        const section = urlParams.get('section');
        
        if (section) {
            const filterBtn = document.querySelector(`[data-filter="${section}"]`);
            if (filterBtn) {
                filterBtn.click();
            }
        } else {
            // Если параметра section нет, активируем фильтр "Все товары"
            const allFilterBtn = document.querySelector('[data-filter="all"]');
            if (allFilterBtn) {
                allFilterBtn.classList.add('active');
                currentFilter = 'all';
                renderProducts();
            }
        }
    }

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

window.formatPrice = formatPrice;
window.showNotification = showNotification;