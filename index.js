document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    migrateProductImages();
    initializeSmoothScroll();
    initializeFAQ();
    initializeCart();
    initializeMobileMenu();
    
    loadRecommendedProducts();
    loadRandomProducts();
    
    window.addEventListener('productsDataUpdated', () => {
        console.log('Index: Данные обновлены');
        loadRecommendedProducts();
        loadRandomProducts();
    });
}

function migrateProductImages() {
    const products = JSON.parse(localStorage.getItem('products')) || [];
    let needsUpdate = false;
    
    products.forEach(product => {
        if (product.image && (!product.images || product.images.length === 0)) {
            product.images = [product.image];
            needsUpdate = true;
        }
    });
    
    if (needsUpdate) {
        localStorage.setItem('products', JSON.stringify(products));
        console.log('Миграция изображений завершена');
    }
}

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

function initializeFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            faqItems.forEach(otherItem => {
                otherItem.classList.remove('active');
            });
            
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
}

function initializeCart() {
    updateCartDisplay();
    
    const cartBtn = document.getElementById('cartBtn');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartClose = document.getElementById('cartClose');
    
    if (cartBtn && cartSidebar) {
        cartBtn.addEventListener('click', () => {
            cartSidebar.classList.add('active');
        });
    }
    
    if (cartClose) {
        cartClose.addEventListener('click', () => {
            cartSidebar.classList.remove('active');
        });
    }
    
    document.addEventListener('click', (e) => {
        if (cartSidebar && cartSidebar.classList.contains('active') && 
            !cartSidebar.contains(e.target) && 
            e.target !== cartBtn && 
            !cartBtn.contains(e.target)) {
            cartSidebar.classList.remove('active');
        }
    });
}

function updateCartDisplay() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCount = document.querySelector('.cart-count');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const emptyCart = document.getElementById('emptyCart');
    const cartContent = document.getElementById('cartContent');
    
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    }
    
    if (cartItems && cartTotal && emptyCart && cartContent) {
        if (cart.length === 0) {
            emptyCart.style.display = 'block';
            cartContent.style.display = 'none';
        } else {
            emptyCart.style.display = 'none';
            cartContent.style.display = 'block';
            
            cartItems.innerHTML = '';
            let total = 0;
            
            cart.forEach((item, index) => {
                const itemTotal = item.price * item.quantity;
                total += itemTotal;
                
                const cartItemElement = document.createElement('div');
                cartItemElement.className = 'cart-item';
                cartItemElement.innerHTML = `
                    <div class="cart-item-image">
                        ${item.image ? `<img src="${item.image}" alt="${item.name}">` : 
                          '<div class="no-image"><i class="fas fa-box"></i></div>'}
                    </div>
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <p class="cart-item-price">${formatPrice(item.price)} × ${item.quantity}</p>
                        <div class="cart-item-actions">
                            <button class="quantity-btn" onclick="updateCartQuantity(${index}, ${item.quantity - 1})">-</button>
                            <span>${item.quantity}</span>
                            <button class="quantity-btn" onclick="updateCartQuantity(${index}, ${item.quantity + 1})">+</button>
                            <button class="remove-btn" onclick="removeFromCart(${index})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
                cartItems.appendChild(cartItemElement);
            });
            
            cartTotal.textContent = formatPrice(total);
        }
    }
}

function updateCartQuantity(index, newQuantity) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (newQuantity <= 0) {
        removeFromCart(index);
        return;
    }
    
    if (cart[index]) {
        cart[index].quantity = newQuantity;
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
    }
}

function removeFromCart(index) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
}

function initializeMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
            
            const spans = menuToggle.querySelectorAll('span');
            if (mainNav.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(6px, 6px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(6px, -6px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    }
}

function loadRecommendedProducts() {
    const products = JSON.parse(localStorage.getItem('products')) || [];
    const recommendedGrid = document.querySelector('.recommended-products-grid');
    
    if (!recommendedGrid) return;
    
    const recommendedProducts = products.filter(product => product.recommended === 'true');
    
    if (recommendedProducts.length === 0) {
        recommendedGrid.innerHTML = `
            <div class="empty-products">
                <i class="fas fa-box-open"></i>
                <p>Рекомендуемые товары появятся здесь</p>
            </div>
        `;
        return;
    }
    
    recommendedGrid.innerHTML = '';
    
    recommendedProducts.forEach(product => {
        const productCard = createProductCard(product);
        recommendedGrid.appendChild(productCard);
    });
}

function loadRandomProducts() {
    const products = JSON.parse(localStorage.getItem('products')) || [];
    const randomGrid = document.querySelector('.random-products-grid');
    
    if (!randomGrid) return;
    
    const shuffled = [...products].sort(() => 0.5 - Math.random());
    const randomProducts = shuffled.slice(0, 3);
    
    if (randomProducts.length === 0) {
        randomGrid.innerHTML = `
            <div class="empty-products">
                <i class="fas fa-box-open"></i>
                <p>Случайные товары появятся здесь</p>
            </div>
        `;
        return;
    }
    
    randomGrid.innerHTML = '';
    
    randomProducts.forEach(product => {
        const productCard = createRandomProductCard(product);
        randomGrid.appendChild(productCard);
    });
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const productImage = (product.images && product.images.length > 0) 
        ? product.images[0] 
        : product.image || null;
    
    card.innerHTML = `
        <div class="product-image">
            ${productImage ? `<img src="${productImage}" alt="${product.name}" loading="lazy">` : 
              '<div class="no-image"><i class="fas fa-box"></i><p>Изображение отсутствует</p></div>'}
            ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
            <div class="product-actions">
                <button class="btn btn-small" onclick="addToCart(${product.id})">
                    <i class="fas fa-shopping-cart"></i>
                </button>
            </div>
        </div>
        <div class="product-info">
            <h3 class="product-title">${product.name}</h3>
            <p class="product-description">${product.description || 'Описание товара'}</p>
            <div class="product-price">${formatPrice(product.price)}</div>
        </div>
    `;
    
    return card;
}

function createRandomProductCard(product) {
    const card = document.createElement('div');
    card.className = 'random-product-card';
    
    const productImage = (product.images && product.images.length > 0) 
        ? product.images[0] 
        : product.image || null;
    
    card.innerHTML = `
        <div class="random-product-image">
            ${productImage ? `<img src="${productImage}" alt="${product.name}" loading="lazy">` : 
              '<div class="no-image"><i class="fas fa-box"></i><p>Изображение отсутствует</p></div>'}
            ${product.badge ? `<span class="random-product-badge">${product.badge}</span>` : ''}
        </div>
        <div class="random-product-content">
            <div class="random-product-category">${product.category || 'Категория'}</div>
            <h3 class="random-product-title">${product.name}</h3>
            <div class="random-product-price">${formatPrice(product.price)}</div>
            <ul class="random-product-features">
                <li>Высокое качество</li>
                <li>Быстрая доставка</li>
                <li>Гарантия возврата</li>
            </ul>
            <div class="random-product-actions">
                <button class="btn btn-small" onclick="addToCart(${product.id})">
                    <i class="fas fa-shopping-cart"></i> В корзину
                </button>
                <button class="btn btn-small btn-outline">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
        </div>
    `;
    
    return card;
}

function addToCart(productId) {
    const products = JSON.parse(localStorage.getItem('products')) || [];
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        console.error('Товар не найден');
        return;
    }
    
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        const productImage = (product.images && product.images.length > 0) 
            ? product.images[0] 
            : product.image || null;
            
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: productImage,
            quantity: 1
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
    
    showNotification('Товар добавлен в корзину!');
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--primary-color);
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0
    }).format(price);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .notification {
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    }
    
    .cart-item {
        display: flex;
        gap: 15px;
        padding: 15px;
        border-bottom: 1px solid var(--border-color);
        align-items: center;
    }
    
    .cart-item-image {
        width: 60px;
        height: 60px;
        border-radius: 5px;
        overflow: hidden;
        flex-shrink: 0;
    }
    
    .cart-item-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .cart-item-details {
        flex-grow: 1;
    }
    
    .cart-item-details h4 {
        margin: 0 0 5px 0;
        font-size: 14px;
        color: var(--text-dark);
    }
    
    .cart-item-price {
        margin: 0 0 10px 0;
        font-size: 14px;
        color: var(--primary-color);
        font-weight: 600;
    }
    
    .cart-item-actions {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .quantity-btn {
        width: 25px;
        height: 25px;
        border: 1px solid var(--border-color);
        background: white;
        border-radius: 3px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
    }
    
    .quantity-btn:hover {
        background: var(--bg-light);
    }
    
    .remove-btn {
        background: none;
        border: none;
        color: #ff4444;
        cursor: pointer;
        padding: 5px;
        margin-left: 10px;
    }
    
    .remove-btn:hover {
        color: #cc0000;
    }
    
    .empty-products {
        grid-column: 1 / -1;
        text-align: center;
        padding: 3rem;
        color: var(--text-light);
    }
    
    .empty-products i {
        font-size: 3rem;
        margin-bottom: 1rem;
        color: #ddd;
    }
    
    .product-image-small {
        width: 40px;
        height: 40px;
        border-radius: 4px;
        object-fit: cover;
        margin-right: 10px;
    }
    
    .product-with-image {
        display: flex;
        align-items: center;
    }
    
    .status-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
    }
    
    .status-badge.active {
        background: #e8f5e8;
        color: #2e7d32;
    }
    
    .status-badge.inactive {
        background: #ffebee;
        color: #c62828;
    }
    
    .product-actions {
        display: flex;
        gap: 5px;
        flex-wrap: wrap;
    }
    
    .btn-edit, .btn-delete, .btn-view {
        padding: 6px 12px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: all 0.3s ease;
    }
    
    .btn-edit {
        background: #2196f3;
        color: white;
    }
    
    .btn-delete {
        background: #f44336;
        color: white;
    }
    
    .btn-view {
        background: #4caf50;
        color: white;
    }
    
    .btn-edit:hover {
        background: #1976d2;
    }
    
    .btn-delete:hover {
        background: #d32f2f;
    }
    
    .btn-view:hover {
        background: #388e3c;
    }
`;
document.head.appendChild(style);

window.addToCart = addToCart;
window.updateCartQuantity = updateCartQuantity;
window.removeFromCart = removeFromCart;