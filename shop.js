// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize cart
    initializeCart();
    
    // Initialize filters
    initializeFilters();
    
    // Initialize modal
    initializeModal();
    
    // Initialize mobile menu
    initializeMobileMenu();
    
    // Initialize consultation form
    initializeConsultationForm();
}

// Cart functionality
function initializeCart() {
    const cartBtn = document.getElementById('cartBtn');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartClose = document.getElementById('cartClose');
    const cartCount = document.querySelector('.cart-count');
    const cartItems = document.querySelector('.cart-items');
    const totalPrice = document.querySelector('.total-price');
    const checkoutBtn = document.querySelector('.btn-checkout');
    
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Update cart display
    function updateCartDisplay() {
        cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        cartItems.innerHTML = '';
        let total = 0;
        
        cart.forEach((item, index) => {
            total += item.price * item.quantity;
            
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <div class="cart-item-price">${item.price} ₽ × ${item.quantity}</div>
                    <div class="cart-item-actions">
                        <button class="quantity-btn" data-index="${index}" data-action="decrease">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" data-index="${index}" data-action="increase">+</button>
                        <button class="remove-btn" data-index="${index}">×</button>
                    </div>
                </div>
            `;
            cartItems.appendChild(cartItem);
        });
        
        totalPrice.textContent = total + ' ₽';
        
        // Add event listeners to new buttons
        document.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', handleQuantityChange);
        });
        
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', handleRemoveItem);
        });
        
        localStorage.setItem('cart', JSON.stringify(cart));
    }
    
    // Handle quantity changes
    function handleQuantityChange(e) {
        const index = parseInt(e.target.dataset.index);
        const action = e.target.dataset.action;
        
        if (action === 'increase') {
            cart[index].quantity++;
        } else if (action === 'decrease') {
            if (cart[index].quantity > 1) {
                cart[index].quantity--;
            } else {
                cart.splice(index, 1);
            }
        }
        
        updateCartDisplay();
    }
    
    // Handle item removal
    function handleRemoveItem(e) {
        const index = parseInt(e.target.dataset.index);
        cart.splice(index, 1);
        updateCartDisplay();
    }
    
    // Add to cart
    function addToCart(productId) {
        const product = getProductData(productId);
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({
                id: productId,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: 1
            });
        }
        
        updateCartDisplay();
        showNotification('Товар добавлен в корзину!');
    }
    
    // Get product data (mock data - replace with actual data)
    function getProductData(id) {
        const products = {
            1: { name: 'Электрический пантограф Deluxe', price: 45990, image: '/static/images/3_00000.jpg' },
            2: { name: 'Электрический пантограф Basic', price: 32990, image: '/static/images/1_11111.jpg' },
            3: { name: 'Гардеробная система Premium', price: 89990, image: '/static/images/Wardrobe_biege1.jpg' },
            4: { name: 'Эксклюзивный гардероб Black Edition', price: 125990, image: '/static/images/White_black1.jpg' }
        };
        return products[id] || { name: 'Товар', price: 0, image: '' };
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
            showNotification('Корзина пуста!');
            return;
        }
        window.location.href = 'checkout.html';
    });
    
    // Add to cart buttons
    document.querySelectorAll('.btn-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = parseInt(e.target.dataset.product);
            addToCart(productId);
        });
    });
    
    // Initial cart display
    updateCartDisplay();
}

// Filter functionality
function initializeFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.product-card');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            
            const filter = btn.dataset.filter;
            
            productCards.forEach(card => {
                if (filter === 'all' || card.dataset.category === filter) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

// Modal functionality
function initializeModal() {
    const quickViewBtns = document.querySelectorAll('.quick-view');
    const modal = document.getElementById('quickViewModal');
    const modalClose = document.getElementById('modalClose');
    const modalBody = document.querySelector('.modal-body');
    
    quickViewBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = parseInt(e.target.dataset.product);
            showQuickView(productId);
        });
    });
    
    modalClose.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
    
    function showQuickView(productId) {
        const product = getProductData(productId);
        
        modalBody.innerHTML = `
            <div class="quick-view-content">
                <div class="product-images">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="product-details">
                    <h2>${product.name}</h2>
                    <div class="product-rating">
                        <div class="stars">
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                        </div>
                        <span class="rating-count">(15 отзывов)</span>
                    </div>
                    <div class="product-price">
                        <span class="current-price">${product.price} ₽</span>
                    </div>
                    <p>Высококачественная мебель премиум-класса с гарантией 5 лет. Идеальное решение для вашего интерьера.</p>
                    <div class="product-actions">
                        <button class="btn btn-cart" data-product="${productId}">В корзину</button>
                        <button class="btn-wishlist">
                            <i class="far fa-heart"></i> В избранное
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Re-add event listener for the cart button in modal
        modalBody.querySelector('.btn-cart').addEventListener('click', () => {
            addToCart(productId);
            modal.classList.remove('active');
        });
        
        modal.classList.add('active');
    }
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

// Consultation form functionality
function initializeConsultationForm() {
    const form = document.getElementById('consultationForm');
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Simple validation
        const inputs = form.querySelectorAll('input[required], textarea[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                input.style.borderColor = 'red';
            } else {
                input.style.borderColor = '';
            }
        });
        
        if (isValid) {
            // Simulate form submission
            showNotification('Заявка отправлена! Мы свяжемся с вами в ближайшее время.');
            form.reset();
        } else {
            showNotification('Пожалуйста, заполните все обязательные поля.');
        }
    });
}

// Utility functions
function showNotification(message) {
    // Create notification element
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
        z-index: 1003;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add CSS animations for notifications
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
`;
document.head.appendChild(style);

// Wishlist functionality
document.querySelectorAll('.btn-wishlist').forEach(btn => {
    btn.addEventListener('click', function() {
        this.classList.toggle('active');
        const icon = this.querySelector('i');
        
        if (this.classList.contains('active')) {
            icon.classList.remove('far');
            icon.classList.add('fas');
            showNotification('Товар добавлен в избранное!');
        } else {
            icon.classList.remove('fas');
            icon.classList.add('far');
            showNotification('Товар удален из избранного!');
        }
    });
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            const headerHeight = document.querySelector('.header').offsetHeight;
            const targetPosition = targetElement.offsetTop - headerHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});