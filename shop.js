// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
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
    
    // Initialize consultation form
    initializeConsultationForm();
}

// Products data
const productsData = [
    // Страница 1 (1-15)
    { id: 1, name: "Тест товар 1", price: 45990, category: "pantograph", badge: "Хит продаж" },
    { id: 2, name: "Тест товар 2", price: 32990, category: "pantograph" },
    { id: 3, name: "Тест товар 3", price: 89990, category: "wardrobe", badge: "Новинка" },
    { id: 4, name: "Тест товар 4", price: 125990, category: "premium" },
    { id: 5, name: "Тест товар 5", price: 75990, category: "wardrobe" },
    { id: 6, name: "Тест товар 6", price: 56990, category: "pantograph" },
    { id: 7, name: "Тест товар 7", price: 98990, category: "premium", badge: "Хит продаж" },
    { id: 8, name: "Тест товар 8", price: 42990, category: "pantograph" },
    { id: 9, name: "Тест товар 9", price: 67990, category: "wardrobe" },
    { id: 10, name: "Тест товар 10", price: 112990, category: "premium" },
    { id: 11, name: "Тест товар 11", price: 38990, category: "pantograph" },
    { id: 12, name: "Тест товар 12", price: 82990, category: "wardrobe", badge: "Новинка" },
    { id: 13, name: "Тест товар 13", price: 95990, category: "premium" },
    { id: 14, name: "Тест товар 14", price: 49990, category: "pantograph" },
    { id: 15, name: "Тест товар 15", price: 72990, category: "wardrobe" },
    
    // Страница 2 (16-30)
    { id: 16, name: "Тест товар 16", price: 53990, category: "pantograph" },
    { id: 17, name: "Тест товар 17", price: 87990, category: "wardrobe", badge: "Хит продаж" },
    { id: 18, name: "Тест товар 18", price: 119990, category: "premium" },
    { id: 19, name: "Тест товар 19", price: 46990, category: "pantograph" },
    { id: 20, name: "Тест товар 20", price: 78990, category: "wardrobe" },
    { id: 21, name: "Тест товар 21", price: 102990, category: "premium", badge: "Новинка" },
    { id: 22, name: "Тест товар 22", price: 35990, category: "pantograph" },
    { id: 23, name: "Тест товар 23", price: 69990, category: "wardrobe" },
    { id: 24, name: "Тест товар 24", price: 92990, category: "premium" },
    { id: 25, name: "Тест товар 25", price: 41990, category: "pantograph" },
    { id: 26, name: "Тест товар 26", price: 84990, category: "wardrobe" },
    { id: 27, name: "Тест товар 27", price: 109990, category: "premium", badge: "Хит продаж" },
    { id: 28, name: "Тест товар 28", price: 38990, category: "pantograph" },
    { id: 29, name: "Тест товар 29", price: 76990, category: "wardrobe" },
    { id: 30, name: "Тест товар 30", price: 99990, category: "premium" },
    
    // Страница 3 (31-45)
    { id: 31, name: "Тест товар 31", price: 44990, category: "pantograph", badge: "Новинка" },
    { id: 32, name: "Тест товар 32", price: 81990, category: "wardrobe" },
    { id: 33, name: "Тест товар 33", price: 115990, category: "premium" },
    { id: 34, name: "Тест товар 34", price: 37990, category: "pantograph" },
    { id: 35, name: "Тест товар 35", price: 73990, category: "wardrobe", badge: "Хит продаж" },
    { id: 36, name: "Тест товар 36", price: 96990, category: "premium" },
    { id: 37, name: "Тест товар 37", price: 40990, category: "pantograph" },
    { id: 38, name: "Тест товар 38", price: 88990, category: "wardrobe" },
    { id: 39, name: "Тест товар 39", price: 122990, category: "premium", badge: "Новинка" },
    { id: 40, name: "Тест товар 40", price: 48990, category: "pantograph" },
    { id: 41, name: "Тест товар 41", price: 79990, category: "wardrobe" },
    { id: 42, name: "Тест товар 42", price: 105990, category: "premium" },
    { id: 43, name: "Тест товар 43", price: 42990, category: "pantograph" },
    { id: 44, name: "Тест товар 44", price: 85990, category: "wardrobe", badge: "Хит продаж" },
    { id: 45, name: "Тест товар 45", price: 118990, category: "premium" }
];

// Products and pagination functionality
function initializeProducts() {
    const productsGrid = document.getElementById('productsGrid');
    const pagination = document.getElementById('pagination');
    const itemsPerPage = 15;
    const totalPages = Math.ceil(productsData.length / itemsPerPage);
    let currentPage = 1;
    let currentFilter = 'all';

    // Render products for current page and filter
    function renderProducts() {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        
        let filteredProducts = productsData;
        if (currentFilter !== 'all') {
            filteredProducts = productsData.filter(product => product.category === currentFilter);
        }
        
        const productsToShow = filteredProducts.slice(startIndex, endIndex);
        
        productsGrid.innerHTML = '';
        
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
        const oldPrice = product.oldPrice ? `<span class="old-price">${product.oldPrice} ₽</span>` : '';
        
        card.innerHTML = `
            <div class="product-image">
                <div style="width: 100%; height: 100%; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #666; font-size: 1.2rem;">
                    ТЕСТ ИЗОБРАЖЕНИЕ
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
                    <span class="current-price">${product.price} ₽</span>
                    ${oldPrice}
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
            });
        });
    }

    // Initialize filters
    function initializeFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
        
        // Обработка кнопок фильтров
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
        
        // Обработка ссылок в боковой навигации
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Убрать активный класс у всех ссылок
                navLinks.forEach(l => l.classList.remove('active'));
                // Добавить активный класс к текущей ссылке
                link.classList.add('active');
                
                // Определить фильтр на основе href
                const filter = link.getAttribute('href').replace('#', '');
                if (filter === 'shop.html') {
                    currentFilter = 'all';
                } else {
                    currentFilter = filter;
                }
                
                // Обновить активную кнопку фильтра
                filterBtns.forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.filter === currentFilter) {
                        btn.classList.add('active');
                    }
                });
                
                currentPage = 1;
                renderProducts();
            });
        });
    }

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
            cartItems.innerHTML = '<p style="text-align: center; padding: 2rem;">Корзина пуста</p>';
            cartCount.textContent = '0';
            totalPrice.textContent = '0 ₽';
            return;
        }
        
        let total = 0;
        
        cart.forEach(item => {
            const product = productsData.find(p => p.id === item.id);
            const itemTotal = product.price * item.quantity;
            total += itemTotal;
            
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="cart-item-info">
                    <h4>${product.name}</h4>
                    <p>${product.price} ₽ × ${item.quantity}</p>
                </div>
                <div class="cart-item-actions">
                    <button class="quantity-btn minus" data-id="${product.id}">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn plus" data-id="${product.id}">+</button>
                    <button class="remove-btn" data-id="${product.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            cartItems.appendChild(cartItem);
        });
        
        cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
        totalPrice.textContent = `${total} ₽`;
        
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
    
    // Add product to cart
    function addToCart(productId) {
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ id: productId, quantity: 1 });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
        
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
        cart = cart.filter(item => item.id !== productId);
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
            alert('Корзина пуста');
            return;
        }
        
        alert('Заказ оформлен! Спасибо за покупку!');
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
        cartSidebar.classList.remove('active');
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
    const product = productsData.find(p => p.id === productId);
    
    if (!product) return;
    
    modalBody.innerHTML = `
        <div class="modal-product">
            <div class="modal-product-image">
                <div style="width: 100%; height: 300px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #666; font-size: 1.5rem;">
                    ТЕСТ ИЗОБРАЖЕНИЕ
                </div>
            </div>
            <div class="modal-product-info">
                <h2>${product.name}</h2>
                <div class="modal-product-price">
                    <span class="current-price">${product.price} ₽</span>
                </div>
                <div class="modal-product-description">
                    <p>Это тестовое описание товара. Здесь будет размещена подробная информация о продукте, его характеристиках и преимуществах.</p>
                    <ul>
                        <li>Тест характеристика 1</li>
                        <li>Тест характеристика 2</li>
                        <li>Тест характеристика 3</li>
                    </ul>
                </div>
                <button class="btn btn-primary btn-add-to-cart" data-product="${product.id}">Добавить в корзину</button>
            </div>
        </div>
    `;
    
    // Add event listener to modal add to cart button
    const addToCartBtn = modalBody.querySelector('.btn-add-to-cart');
    addToCartBtn.addEventListener('click', () => {
        addToCart(product.id);
        modal.classList.remove('active');
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

// Consultation form functionality
function initializeConsultationForm() {
    const consultationForm = document.getElementById('consultationForm');
    
    consultationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = new FormData(consultationForm);
        const name = consultationForm.querySelector('input[type="text"]').value;
        const phone = consultationForm.querySelector('input[type="tel"]').value;
        
        // Simulate form submission
        alert(`Спасибо, ${name}! Мы свяжемся с вами по номеру ${phone} в ближайшее время.`);
        consultationForm.reset();
    });
}