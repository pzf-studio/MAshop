// index.js - Главная страница MA Furniture
document.addEventListener('DOMContentLoaded', function() {
    console.log('MA Furniture - Главная страница загружена');
    
    initializeApp();
});

function initializeApp() {
    // Инициализация базовых функций
    initializeSmoothScroll();
    initializeFAQ();
    initializeCart();
    initializeMobileMenu();
    
    // Загрузка товаров
    loadRecommendedProducts();
    loadRandomProducts();
    
    // Настройка реального обновления
    setupRealTimeUpdates();
    
    console.log('Приложение инициализировано');
}

// Плавная прокрутка
function initializeSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// FAQ аккордеон
function initializeFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Закрываем все элементы
            faqItems.forEach(otherItem => {
                otherItem.classList.remove('active');
            });
            
            // Открываем текущий, если он был закрыт
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
}

// Корзина
function initializeCart() {
    updateCartDisplay();
    
    // Обработчики для корзины
    const cartBtn = document.getElementById('cartBtn');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartClose = document.getElementById('cartClose');
    
    if (cartBtn && cartSidebar) {
        cartBtn.addEventListener('click', () => {
            cartSidebar.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (cartClose && cartSidebar) {
        cartClose.addEventListener('click', () => {
            cartSidebar.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    // Закрытие корзины при клике вне её области
    document.addEventListener('click', (e) => {
        if (cartSidebar && cartSidebar.classList.contains('active') && 
            !cartSidebar.contains(e.target) && 
            e.target !== cartBtn && 
            !cartBtn.contains(e.target)) {
            cartSidebar.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

function updateCartDisplay() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCount = document.querySelector('.cart-count');
    const cartTotal = document.querySelector('.total-price');
    const cartItems = document.getElementById('cartItems');
    
    // Обновляем счетчик
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) cartCount.textContent = totalItems;
    
    // Обновляем общую сумму
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (cartTotal) cartTotal.textContent = formatPrice(totalPrice);
    
    // Обновляем список товаров
    if (cartItems) {
        if (cart.length === 0) {
            cartItems.innerHTML = '<div class="empty-cart"><p>Корзина пуста</p></div>';
        } else {
            cartItems.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <div class="cart-item-image">
                        ${item.image ? `<img src="${item.image}" alt="${item.name}">` : ''}
                    </div>
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <div class="cart-item-price">${formatPrice(item.price)}</div>
                        <div class="cart-item-quantity">Количество: ${item.quantity}</div>
                    </div>
                </div>
            `).join('');
        }
    }
}

// Мобильное меню
function initializeMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.querySelector('.main-nav');
    
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
    }
    
    // Закрытие мобильного меню при клике на ссылку
    document.querySelectorAll('.main-nav a').forEach(link => {
        link.addEventListener('click', () => {
            if (mainNav) mainNav.classList.remove('active');
            if (menuToggle) menuToggle.classList.remove('active');
        });
    });
}

// Загрузка рекомендуемых товаров
function loadRecommendedProducts() {
    const container = document.getElementById('recommendedProductsGrid');
    if (!container) {
        console.log('Контейнер recommendedProductsGrid не найден');
        return;
    }
    
    console.log('Загрузка рекомендуемых товаров...');
    
    const products = getActiveProducts();
    const recommendedProducts = products.filter(product => product.featured).slice(0, 8);
    
    console.log('Найдено рекомендуемых товаров:', recommendedProducts.length);
    
    if (recommendedProducts.length === 0) {
        container.innerHTML = `
            <div class="empty-products">
                <i class="fas fa-box-open"></i>
                <h3>Рекомендуемые товары</h3>
                <p>Скоро здесь появятся специально подобранные для вас товары</p>
                <a href="shop.html" class="btn btn-primary">Перейти в магазин</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recommendedProducts.map(product => `
        <div class="product-card">
            <div class="product-image">
                ${product.images && product.images.length > 0 ? 
                    `<img src="${product.images[0]}" alt="${product.name}" loading="lazy">` : 
                    `<div class="no-image">${product.name}</div>`
                }
                ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
                <div class="product-actions">
                    <button class="btn btn-primary btn-add-cart" onclick="addToCartFromIndex(${product.id})">
                        <i class="fas fa-shopping-cart"></i>
                    </button>
                    <a href="shop.html?product=${product.id}" class="btn btn-outline">
                        <i class="fas fa-eye"></i>
                    </a>
                </div>
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description || 'Эксклюзивный товар премиум-класса'}</p>
                <div class="product-price">${formatPrice(product.price)}</div>
            </div>
        </div>
    `).join('');
}

// Загрузка случайных товаров
function loadRandomProducts() {
    const container = document.getElementById('randomProductsGrid');
    if (!container) {
        console.log('Контейнер randomProductsGrid не найден');
        return;
    }
    
    console.log('Загрузка случайных товаров...');
    
    const products = getActiveProducts();
    const randomProducts = getRandomProducts(products, 3);
    
    console.log('Найдено случайных товаров:', randomProducts.length);
    
    if (randomProducts.length === 0) {
        container.innerHTML = `
            <div class="empty-products">
                <i class="fas fa-box-open"></i>
                <p>Товары скоро появятся</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = randomProducts.map(product => `
        <div class="random-product-card">
            <div class="random-product-image">
                ${product.images && product.images.length > 0 ? 
                    `<img src="${product.images[0]}" alt="${product.name}" loading="lazy">` : 
                    `<div class="no-image"><i class="fas fa-cube"></i></div>`
                }
                ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
            </div>
            <div class="random-product-content">
                <h3>${product.name}</h3>
                <p>${product.description || 'Качественный товар от MA Furniture'}</p>
                <div class="random-product-price">${formatPrice(product.price)}</div>
                <div class="random-product-actions">
                    <button class="btn btn-primary" onclick="addToCartFromIndex(${product.id})">
                        <i class="fas fa-shopping-cart"></i> В корзину
                    </button>
                    <a href="shop.html?product=${product.id}" class="btn btn-outline">
                        Подробнее
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

// Получение активных товаров
function getActiveProducts() {
    let products = [];
    
    try {
        // Пробуем получить товары из админки
        const adminProducts = JSON.parse(localStorage.getItem('adminProducts')) || [];
        const shopProducts = JSON.parse(localStorage.getItem('products')) || [];
        
        console.log('Товары из админки:', adminProducts.length);
        console.log('Товары из магазина:', shopProducts.length);
        
        // Приоритет у товаров из админки
        if (adminProducts.length > 0) {
            products = adminProducts
                .filter(product => product.active === true)
                .map(product => ({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    category: product.category,
                    description: product.description,
                    badge: product.badge,
                    active: product.active,
                    featured: product.featured || false,
                    images: product.images || [],
                    features: product.features || [],
                    specifications: product.specifications || {},
                    section: product.section || 'all'
                }));
        } else if (shopProducts.length > 0) {
            products = shopProducts.filter(product => product.active === true);
        }
        
        console.log('Активные товары для отображения:', products.length);
        
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        products = [];
    }
    
    return products;
}

// Получение случайных товаров
function getRandomProducts(products, count) {
    if (products.length <= count) return products;
    
    const shuffled = [...products].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Настройка реального обновления
function setupRealTimeUpdates() {
    // Слушаем события из админки
    window.addEventListener('storage', function(e) {
        console.log('Storage event:', e.key);
        
        if (e.key === 'adminProducts' || e.key === 'products') {
            console.log('Обновление товаров обнаружено');
            setTimeout(() => {
                loadRecommendedProducts();
                loadRandomProducts();
            }, 100);
        }
        
        if (e.key === 'cart') {
            updateCartDisplay();
        }
    });
    
    // Слушаем кастомные события
    window.addEventListener('productsUpdated', function(e) {
        console.log('Кастомное событие productsUpdated');
        loadRecommendedProducts();
        loadRandomProducts();
    });
    
    window.addEventListener('adminProductsUpdated', function(e) {
        console.log('Событие из админки');
        loadRecommendedProducts();
        loadRandomProducts();
    });
    
    // Периодическая проверка (fallback)
    setInterval(() => {
        loadRecommendedProducts();
        loadRandomProducts();
    }, 30000);
}

// Функция добавления в корзину с главной страницы
function addToCartFromIndex(productId) {
    const products = getActiveProducts();
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        showNotification('Товар не найден', 'error');
        return;
    }
    
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.images && product.images.length > 0 ? product.images[0] : null,
            quantity: 1
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
    showNotification('Товар добавлен в корзину');
    
    // Показываем корзину на мобильных
    if (window.innerWidth <= 768) {
        const cartSidebar = document.getElementById('cartSidebar');
        if (cartSidebar) {
            cartSidebar.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
}

// Утилиты
function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0
    }).format(price);
}

function showNotification(message, type = 'success') {
    // Создаем уведомление
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Анимация появления
    setTimeout(() => notification.style.transform = 'translateX(0)', 100);
    
    // Автоматическое скрытие
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Делаем функции глобальными
window.addToCartFromIndex = addToCartFromIndex;
window.formatPrice = formatPrice;