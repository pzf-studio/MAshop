// Product Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeProductPage();
});

function initializeProductPage() {
    // Get product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    
    if (!productId) {
        showError('Товар не найден');
        return;
    }
    
    // Load product data
    loadProductData(productId);
    
    // Initialize product functionality
    initializeProductGallery();
    initializeProductTabs();
    initializeQuantitySelector();
    initializeAddToCart();
    initializeMobileMenu();
}

function loadProductData(productId) {
    const products = getActiveProducts();
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        showError('Товар не найден');
        return;
    }
    
    // Update page title
    document.title = `${product.name} - MA Furniture`;
    
    // Update breadcrumb
    document.getElementById('breadcrumbCategory').textContent = getCategoryName(product.category);
    document.getElementById('breadcrumbName').textContent = product.name;
    
    // Update main product info
    document.getElementById('productTitle').textContent = product.name;
    document.getElementById('productSku').textContent = `MF-${product.id.toString().padStart(3, '0')}`;
    document.getElementById('productPrice').textContent = formatPrice(product.price);
    
    // Update description
    const descriptionElement = document.getElementById('productDescription');
    const detailedDescription = document.getElementById('detailedDescription');
    
    if (product.description) {
        descriptionElement.textContent = product.description;
        detailedDescription.innerHTML = `<p>${product.description}</p>`;
    } else {
        const defaultDescription = `Элитный ${getCategoryName(product.category).toLowerCase()} премиум-класса от MA Furniture. Изготовлен из высококачественных материалов с вниманием к деталям.`;
        descriptionElement.textContent = defaultDescription;
        detailedDescription.innerHTML = `<p>${defaultDescription}</p>`;
    }
    
    // Update badge
    const badgeContainer = document.getElementById('productBadgeContainer');
    if (product.badge) {
        badgeContainer.innerHTML = `<span class="badge ${product.badge === 'Хит продаж' ? 'hit' : 'new'}">${product.badge}</span>`;
    } else {
        badgeContainer.innerHTML = '';
    }
    
    // Update gallery
    updateProductGallery(product);
    
    // Update features
    updateProductFeatures(product);
    
    // Update specifications
    updateProductSpecifications(product);
    
    // Load related products
    loadRelatedProducts(product);
    
    // Add to cart button
    document.getElementById('addToCartBtn').dataset.productId = product.id;
}

function updateProductGallery(product) {
    const gallery = document.getElementById('productGallery');
    
    let mainImage = '';
    let thumbnails = '';
    
    if (product.images && product.images.length > 0) {
        // Use actual product images
        mainImage = `<img src="${product.images[0]}" alt="${product.name}" id="mainImage">`;
        
        thumbnails = product.images.map((image, index) => `
            <div class="thumbnail ${index === 0 ? 'active' : ''}" data-image="${image}">
                <img src="${image}" alt="${product.name} - вид ${index + 1}">
            </div>
        `).join('');
    } else {
        // Use placeholder
        mainImage = `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #666; font-size: 1.2rem;">${product.name}</div>`;
        
        thumbnails = `
            <div class="thumbnail active" data-image="placeholder">
                <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #666; font-size: 0.8rem;">Основное</div>
            </div>
        `;
    }
    
    gallery.innerHTML = `
        <div class="main-image">
            ${mainImage}
        </div>
        <div class="thumbnail-grid">
            ${thumbnails}
        </div>
    `;
}

function updateProductFeatures(product) {
    const featuresContainer = document.getElementById('productFeatures');
    
    const features = [
        'Премиальные материалы высшего качества',
        'Эксклюзивный дизайн от итальянских мастеров',
        'Долговечность и надежность конструкции',
        'Легкость в уходе и обслуживании',
        'Экологически чистые материалы',
        'Гарантия 2 года'
    ];
    
    featuresContainer.innerHTML = `
        <ul class="feature-list">
            ${features.map(feature => `<li>${feature}</li>`).join('')}
        </ul>
    `;
}

function updateProductSpecifications(product) {
    const specsContainer = document.getElementById('specificationsGrid');
    
    const specifications = {
        'Категория': getCategoryName(product.category),
        'Материал': 'Натуральное дерево, металл',
        'Цвет': 'Классические оттенки',
        'Размеры': 'Индивидуальные',
        'Вес': 'Зависит от конфигурации',
        'Стиль': 'Современный классический',
        'Производство': 'Россия'
    };
    
    specsContainer.innerHTML = Object.entries(specifications)
        .map(([key, value]) => `
            <div class="spec-item">
                <div class="spec-name">${key}</div>
                <div class="spec-value">${value}</div>
            </div>
        `).join('');
}

function loadRelatedProducts(currentProduct) {
    const relatedContainer = document.getElementById('relatedProducts');
    const products = getActiveProducts()
        .filter(p => p.id !== currentProduct.id && p.category === currentProduct.category)
        .slice(0, 4);
    
    if (products.length === 0) {
        relatedContainer.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1 / -1;">Нет сопутствующих товаров</p>';
        return;
    }
    
    relatedContainer.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-image">
                <div style="width: 100%; height: 100%; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #666; font-size: 1.2rem;">
                    ${product.name}
                </div>
                ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
                <button class="quick-view" onclick="window.location.href='product.html?id=${product.id}'">Быстрый просмотр</button>
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
        </div>
    `).join('');
}

function initializeProductGallery() {
    document.addEventListener('click', function(e) {
        if (e.target.closest('.thumbnail')) {
            const thumbnail = e.target.closest('.thumbnail');
            const mainImage = document.getElementById('mainImage');
            const imageSrc = thumbnail.dataset.image;
            
            if (imageSrc && imageSrc !== 'placeholder' && mainImage) {
                // Update main image
                mainImage.src = imageSrc;
                
                // Update active thumbnail
                document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                thumbnail.classList.add('active');
            }
        }
    });
}

function initializeProductTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show corresponding tab pane
            tabPanes.forEach(pane => pane.classList.remove('active'));
            document.getElementById(`${tabId}Tab`).classList.add('active');
        });
    });
}

function initializeQuantitySelector() {
    const minusBtn = document.querySelector('.quantity-btn.minus');
    const plusBtn = document.querySelector('.quantity-btn.plus');
    const quantityInput = document.querySelector('.quantity-input');
    
    minusBtn.addEventListener('click', () => {
        let value = parseInt(quantityInput.value);
        if (value > 1) {
            quantityInput.value = value - 1;
        }
    });
    
    plusBtn.addEventListener('click', () => {
        let value = parseInt(quantityInput.value);
        if (value < 10) {
            quantityInput.value = value + 1;
        }
    });
    
    quantityInput.addEventListener('change', () => {
        let value = parseInt(quantityInput.value);
        if (value < 1) quantityInput.value = 1;
        if (value > 10) quantityInput.value = 10;
    });
}

function initializeAddToCart() {
    const addToCartBtn = document.getElementById('addToCartBtn');
    
    addToCartBtn.addEventListener('click', function() {
        const productId = parseInt(this.dataset.productId);
        const quantity = parseInt(document.querySelector('.quantity-input').value);
        
        // Add to cart multiple times based on quantity
        for (let i = 0; i < quantity; i++) {
            addToCart(productId);
        }
        
        showNotification(`Товар добавлен в корзину (${quantity} шт.)`);
    });
}

function showError(message) {
    const main = document.querySelector('.product-details');
    main.innerHTML = `
        <div class="container" style="text-align: center; padding: 4rem 2rem;">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ddd; margin-bottom: 1rem;"></i>
            <h2>${message}</h2>
            <p>Попробуйте вернуться в <a href="shop.html">магазин</a> и выбрать другой товар.</p>
        </div>
    `;
}

// Utility functions
function getCategoryName(category) {
    const categories = {
        'pantograph': 'Пантографы',
        'wardrobe': 'Гардеробные системы',
        'premium': 'Премиум коллекция'
    };
    return categories[category] || category;
}

function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price);
}

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