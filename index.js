// index.js - Главная страница MA Furniture (обновленная версия)
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    initializeSmoothScroll();
    initializeFAQ();
    initializeCart();
    initializeMobileMenu();
    
    loadRecommendedProducts();
    loadRandomProducts();
    
    // Слушаем обновления данных
    window.addEventListener('productsDataUpdated', () => {
        console.log('Index: Данные обновлены');
        loadRecommendedProducts();
        loadRandomProducts();
    });
}

function loadRecommendedProducts() {
    const container = document.getElementById('recommendedProductsGrid');
    if (!container) return;
    
    const recommendedProducts = dataManager.getFeaturedProducts(8);
    
    if (recommendedProducts.length === 0) {
        container.innerHTML = `
            <div class="empty-products">
                <i class="fas fa-box-open"></i>
                <h3>Рекомендуемые товары</h3>
                <p>Скоро здесь появятся специально подобранные для вас товары</p>
                <a href="admin/admin-login.html" class="btn btn-primary">Добавить товары</a>
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
                    <a href="piece.html?id=${product.id}" class="btn btn-outline">
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

function loadRandomProducts() {
    const container = document.getElementById('randomProductsGrid');
    if (!container) return;
    
    const randomProducts = dataManager.getRandomProducts(3);
    
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
                    <a href="piece.html?id=${product.id}" class="btn btn-outline">
                        Подробнее
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

function addToCartFromIndex(productId) {
    const product = dataManager.getProductById(productId);
    if (!product) {
        showNotification('Товар не найден', 'error');
        return;
    }
    
    // Ваша существующая логика добавления в корзину
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
}