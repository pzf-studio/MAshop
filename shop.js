// shop.js - Интернет-магазин MA Furniture
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    initializeProducts();
    initializeCart();
    initializeFilters();
    initializeModal();
    initializeMobileMenu();
    initializeConsultationForm();
    setupRealTimeSync();
    initializeOrderProcessing();
    initializeCartSidebar(); // Добавляем инициализацию корзины
}

// Products data - загружается из localStorage
let productsData = [];

// Инициализация боковой панели корзины
function initializeCartSidebar() {
    const cartBtn = document.getElementById('cartBtn');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartClose = document.getElementById('cartClose');
    const continueShoppingBtn = document.getElementById('continueShoppingBtn');

    console.log('Initializing cart sidebar...');
    console.log('Cart button:', cartBtn);
    console.log('Cart sidebar:', cartSidebar);

    // Открытие корзины
    if (cartBtn && cartSidebar) {
        cartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Cart button clicked');
            cartSidebar.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    } else {
        console.error('Cart elements not found:', { cartBtn, cartSidebar });
    }

    // Закрытие корзины
    if (cartClose && cartSidebar) {
        cartClose.addEventListener('click', () => {
            cartSidebar.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    // Продолжить покупки
    if (continueShoppingBtn && cartSidebar) {
        continueShoppingBtn.addEventListener('click', () => {
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

    // Закрытие корзины по ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && cartSidebar && cartSidebar.classList.contains('active')) {
            cartSidebar.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// Новый метод для синхронизации в реальном времени
function setupRealTimeSync() {
    window.addEventListener('storage', (e) => {
        if (e.key === 'products' && e.newValue) {
            try {
                console.log('Обновление данных магазина в реальном времени...');
                // Перезагружаем товары
                if (typeof initializeProducts === 'function') {
                    initializeProducts();
                }
                // Обновляем корзину если нужно
                if (typeof initializeCart === 'function') {
                    initializeCart();
                }
                showNotification('Каталог обновлен', 'success');
            } catch (error) {
                console.error('Ошибка обновления магазина:', error);
            }
        }
        
        if (e.key === 'sections' && e.newValue) {
            try {
                console.log('Обновление разделов в реальном времени...');
                // Перезагружаем фильтры
                if (typeof initializeFilters === 'function') {
                    initializeFilters();
                }
            } catch (error) {
                console.error('Ошибка обновления разделов:', error);
            }
        }
    });
}

// Новая функция для инициализации обработки заказов
function initializeOrderProcessing() {
    const checkoutBtn = document.getElementById('checkoutBtn');
    const successCloseBtn = document.getElementById('successCloseBtn');
    const orderSuccessModal = document.getElementById('orderSuccessModal');
    
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', processOrder);
    }
    
    if (successCloseBtn && orderSuccessModal) {
        successCloseBtn.addEventListener('click', () => {
            orderSuccessModal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    // Close success modal when clicking outside
    if (orderSuccessModal) {
        orderSuccessModal.addEventListener('click', (e) => {
            if (e.target === orderSuccessModal) {
                orderSuccessModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
}

// Функция обработки заказа
async function processOrder() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const comment = document.getElementById('orderComment')?.value || '';
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (cart.length === 0) {
        showNotification('Корзина пуста', 'error');
        return;
    }
    
    // Показываем состояние загрузки
    if (checkoutBtn) {
        checkoutBtn.classList.add('loading');
        checkoutBtn.disabled = true;
    }
    
    try {
        // Формируем сообщение для Telegram
        const message = formatOrderMessage(cart, comment);
        
        // Отправляем в Telegram
        const telegramSent = await sendToTelegram(message);
        
        if (telegramSent) {
            // Показываем успешное сообщение
            showOrderSuccess();
            
            // Очищаем корзину
            localStorage.removeItem('cart');
            updateCartDisplay();
            
            // Очищаем комментарий
            if (document.getElementById('orderComment')) {
                document.getElementById('orderComment').value = '';
            }
        } else {
            throw new Error('Не удалось отправить заказ');
        }
    } catch (error) {
        console.error('Order processing error:', error);
        showNotification('Ошибка при оформлении заказа. Попробуйте еще раз.', 'error');
    } finally {
        // Убираем состояние загрузки
        if (checkoutBtn) {
            checkoutBtn.classList.remove('loading');
            checkoutBtn.disabled = false;
        }
    }
}

// Форматирование сообщения для Telegram
function formatOrderMessage(cart, comment) {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    let message = `🛍️ *НОВЫЙ ЗАКАЗ* 🛍️\n\n`;
    message += `*Товаров:* ${totalItems} шт.\n`;
    message += `*Общая сумма:* ${formatPrice(total)}\n\n`;
    message += `*Состав заказа:*\n`;
    
    cart.forEach((item, index) => {
        message += `${index + 1}. ${item.name}\n`;
        message += `   Количество: ${item.quantity} шт.\n`;
        message += `   Цена: ${formatPrice(item.price)} за шт.\n`;
        message += `   Сумма: ${formatPrice(item.price * item.quantity)}\n\n`;
    });
    
    if (comment.trim()) {
        message += `*Комментарий клиента:*\n${comment}\n\n`;
    }
    
    message += `*Контактная информация:*\n`;
    message += `Сайт: MA Furniture\n`;
    message += `Время заказа: ${new Date().toLocaleString('ru-RU')}\n\n`;
    message += `📞 *Требуется обратная связь*`;
    
    return message;
}

// Отправка в Telegram
async function sendToTelegram(message) {
    // Для демонстрации используем заглушку
    // В реальном проекте добавьте ваш Telegram Bot Token и Chat ID
    
    console.log('Telegram message:', message);
    
    // Имитация отправки
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('Заказ успешно отправлен в Telegram');
            resolve(true);
        }, 1500);
    });
}

// Показ успешного оформления заказа
function showOrderSuccess() {
    const orderSuccessModal = document.getElementById('orderSuccessModal');
    const cartSidebar = document.getElementById('cartSidebar');
    
    if (orderSuccessModal) {
        // Закрываем корзину
        if (cartSidebar) {
            cartSidebar.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        // Показываем модальное окно успеха
        setTimeout(() => {
            orderSuccessModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }, 500);
    } else {
        showNotification('Заказ успешно оформлен! Мы свяжемся с вами в ближайшее время.', 'success');
    }
}

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
        
        // Если нет товаров в localStorage, возвращаем пустой массив
        if (products.length === 0) {
            products = [];
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
            filteredProducts = activeProducts.filter(product => 
                product.section === currentFilter || product.category === currentFilter
            );
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
        card.dataset.section = product.section || 'all';
        
        const badge = product.badge ? `<div class="product-badge">${product.badge}</div>` : '';
        
        // Определяем, что показывать в качестве изображения
        let imageContent = '';
        if (product.images && product.images.length > 0) {
            imageContent = `<img src="${product.images[0]}" alt="${product.name}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
        }
        
        // Fallback если изображение не загрузилось или отсутствует
        const fallbackContent = `
            <div style="width: 100%; height: 100%; background: #f0f0f0; display: ${product.images && product.images.length > 0 ? 'none' : 'flex'}; align-items: center; justify-content: center; color: #666; font-size: 1.2rem;">
                ${product.name}
            </div>
        `;
        
        // Используем стандартный URL с параметром ID для страницы товара
        const productUrl = `piece.html?id=${product.id}`;
        
        card.innerHTML = `
            <div class="product-image">
                ${imageContent}
                ${fallbackContent}
                ${badge}
                <button class="quick-view" data-product="${product.id}">Быстрый просмотр</button>
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
                    <button class="btn btn-cart" data-product="${product.id}">В корзину</button>
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
                e.preventDefault();
                e.stopPropagation();
                const productId = parseInt(e.target.dataset.product);
                addToCart(productId);
                
                // Анимация добавления в корзину
                const productCard = e.target.closest('.product-card');
                if (productCard) {
                    productCard.style.transform = 'scale(1.05)';
                    setTimeout(() => {
                        productCard.style.transform = '';
                    }, 300);
                }
            });
        });
        
        // Quick view buttons
        document.querySelectorAll('.quick-view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const productId = parseInt(e.target.dataset.product);
                showProductModal(productId);
            });
        });
        
        // Wishlist buttons
        document.querySelectorAll('.btn-wishlist').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.target.classList.toggle('far');
                e.target.classList.toggle('fas');
                e.target.classList.toggle('active');
                
                // Анимация добавления в избранное
                if (e.target.classList.contains('fas')) {
                    e.target.style.color = '#d4af37';
                    showNotification('Товар добавлен в избранное');
                } else {
                    e.target.style.color = '';
                    showNotification('Товар удален из избранное');
                }
            });
        });
    }

    // Initialize filters
    function initializeFilters() {
        // Загружаем разделы из localStorage
        const sections = JSON.parse(localStorage.getItem('sections')) || this.getDefaultSections();
        const filterContainer = document.querySelector('.catalog-filters');
        
        if (!filterContainer) return;
        
        // Очищаем контейнер и добавляем разделы
        filterContainer.innerHTML = '';
        
        sections.forEach(section => {
            if (section.active) {
                const filterBtn = document.createElement('button');
                filterBtn.className = `filter-btn ${section.code === 'all' ? 'active' : ''}`;
                filterBtn.dataset.filter = section.code;
                filterBtn.textContent = section.name;
                filterContainer.appendChild(filterBtn);
            }
        });

        // Filter buttons
        const filterBtns = document.querySelectorAll('.filter-btn');
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                
                // Update active filter button
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Apply filter
                currentFilter = filter;
                currentPage = 1;
                renderProducts();
            });
        });
    }

    function getDefaultSections() {
        return [
            { id: 1, name: 'Все товары', code: 'all', active: true, productCount: 0 },
            { id: 2, name: 'Пантографы', code: 'pantograph', active: true, productCount: 0 },
            { id: 3, name: 'Nuomi Hera', code: 'nuomi-hera', active: true, productCount: 0 },
            { id: 4, name: 'Nuomi Ralphie', code: 'nuomi-ralphie', active: true, productCount: 0 },
            { id: 5, name: 'Коллекция Wise', code: 'wise', active: true, productCount: 0 },
            { id: 6, name: 'Коллекция Time', code: 'time', active: true, productCount: 0 },
            { id: 7, name: 'Кухонные лифты', code: 'kitchen', active: true, productCount: 0 },
            { id: 8, name: 'Гардеробные системы', code: 'wardrobe', active: true, productCount: 0 },
            { id: 9, name: 'Премиум коллекция', code: 'premium', active: true, productCount: 0 }
        ];
    }

    // Initial render
    renderProducts();
}

// Cart functionality
function initializeCart() {
    updateCartDisplay();
    attachCartEventListeners();
    
    // Make functions available globally
    window.addToCart = addToCart;
    window.updateCartItemQuantity = updateCartItemQuantity;
    window.removeFromCart = removeFromCart;
}

// Обновленная функция отображения корзины
function updateCartDisplay() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCount = document.querySelector('.cart-count');
    const cartTotal = document.querySelector('.total-price');
    const totalItems = document.querySelector('.total-items');
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    
    // Update cart count in header
    const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) cartCount.textContent = totalItemsCount;
    
    // Update cart total
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (cartTotal) cartTotal.textContent = formatPrice(totalPrice);
    if (totalItems) totalItems.textContent = `${totalItemsCount} ${getItemsWord(totalItemsCount)}`;
    
    // Update cart items in sidebar
    if (cartItemsContainer) {
        cartItemsContainer.innerHTML = '';
        
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Ваша корзина пуста</p>
                    <p>Добавьте товары из каталога</p>
                </div>
            `;
        } else {
            cart.forEach(item => {
                const cartItem = document.createElement('div');
                cartItem.className = 'cart-item';
                cartItem.innerHTML = `
                    <div class="cart-item-image">
                        ${item.image ? `<img src="${item.image}" alt="${item.name}" loading="lazy">` : 
                          `<div>${item.name}</div>`}
                    </div>
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <div class="cart-item-price">${formatPrice(item.price)}</div>
                        <div class="cart-item-controls">
                            <button class="quantity-btn minus" data-id="${item.id}" ${item.quantity <= 1 ? 'disabled' : ''}>
                                <i class="fas fa-minus"></i>
                            </button>
                            <span class="quantity">${item.quantity}</span>
                            <button class="quantity-btn plus" data-id="${item.id}">
                                <i class="fas fa-plus"></i>
                            </button>
                            <button class="remove-btn" data-id="${item.id}" title="Удалить">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
                cartItemsContainer.appendChild(cartItem);
            });
        }
    }
    
    // Update checkout button state
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.disabled = cart.length === 0;
    }
    
    // Re-attach event listeners
    attachCartEventListeners();
}

// Функция для правильного склонения слова "товар"
function getItemsWord(count) {
    if (count % 10 === 1 && count % 100 !== 11) return 'товар';
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return 'товара';
    return 'товаров';
}

// Прикрепление обработчиков событий для корзины
function attachCartEventListeners() {
    // Quantity minus buttons
    document.querySelectorAll('.quantity-btn.minus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = parseInt(e.currentTarget.dataset.id);
            updateCartItemQuantity(productId, -1);
        });
    });
    
    // Quantity plus buttons
    document.querySelectorAll('.quantity-btn.plus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = parseInt(e.currentTarget.dataset.id);
            updateCartItemQuantity(productId, 1);
        });
    });
    
    // Remove buttons
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = parseInt(e.currentTarget.dataset.id);
            removeFromCart(productId);
        });
    });
}

// Функция добавления в корзину
function addToCart(productId) {
    const products = JSON.parse(localStorage.getItem('products')) || [];
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
    
    // Автоматически показываем корзину на мобильных устройствах
    if (window.innerWidth <= 768) {
        const cartSidebar = document.getElementById('cartSidebar');
        if (cartSidebar) {
            cartSidebar.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
}

// Функция обновления количества товара
function updateCartItemQuantity(productId, change) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const item = cart.find(item => item.id === productId);
    
    if (item) {
        item.quantity += change;
        
        if (item.quantity <= 0) {
            cart = cart.filter(item => item.id !== productId);
            showNotification('Товар удален из корзины');
        } else {
            showNotification(`Количество обновлено: ${item.quantity}`, 'success');
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
    }
}

// Функция удаления из корзины
function removeFromCart(productId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const itemIndex = cart.findIndex(item => item.id === productId);
    
    if (itemIndex !== -1) {
        const itemName = cart[itemIndex].name;
        cart.splice(itemIndex, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
        showNotification(`"${itemName}" удален из корзины`);
    }
}

// Modal functionality
function initializeModal() {
    const modal = document.getElementById('quickViewModal');
    const closeBtn = document.querySelector('.modal-close');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

function showProductModal(productId) {
    const products = JSON.parse(localStorage.getItem('products')) || [];
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        showNotification('Товар не найден', 'error');
        return;
    }
    
    const modal = document.getElementById('quickViewModal');
    if (!modal) return;
    
    const modalContent = modal.querySelector('.modal-content');
    
    // Format features and specifications
    const featuresHtml = product.features && product.features.length > 0 ? 
        product.features.map(feature => `<li>${feature}</li>`).join('') : 
        '<li>Информация отсутствует</li>';
    
    const specsHtml = product.specifications && Object.keys(product.specifications).length > 0 ? 
        Object.entries(product.specifications).map(([key, value]) => `
            <div class="spec-row">
                <span class="spec-key">${key}:</span>
                <span class="spec-value">${value}</span>
            </div>
        `).join('') : 
        '<div class="spec-row">Информация отсутствует</div>';
    
    // Image content
    let imageContent = '';
    if (product.images && product.images.length > 0) {
        imageContent = product.images.map((img, index) => `
            <div class="modal-image ${index === 0 ? 'active' : ''}">
                <img src="${img}" alt="${product.name}">
            </div>
        `).join('');
    } else {
        imageContent = `
            <div class="modal-image active">
                <div style="width: 100%; height: 300px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #666;">
                    ${product.name}
                </div>
            </div>
        `;
    }
    
    modalContent.innerHTML = `
        <button class="modal-close">
            <i class="fas fa-times"></i>
        </button>
        <div class="modal-body">
            <div class="modal-images">
                ${imageContent}
            </div>
            <div class="modal-info">
                <h2>${product.name}</h2>
                ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
                <div class="modal-price">${formatPrice(product.price)}</div>
                
                <div class="product-description">
                    <p>${product.description || 'Описание товара отсутствует.'}</p>
                </div>
                
                <div class="product-features">
                    <h4>Особенности:</h4>
                    <ul>${featuresHtml}</ul>
                </div>
                
                <div class="product-specifications">
                    <h4>Характеристики:</h4>
                    <div class="specs-list">${specsHtml}</div>
                </div>
                
                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="addToCart(${product.id}); showNotification('Товар добавлен в корзину')">
                        <i class="fas fa-shopping-cart"></i> В корзину
                    </button>
                    <button class="btn btn-outline">
                        <i class="far fa-heart"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Re-attach close event
    modalContent.querySelector('.modal-close').addEventListener('click', () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    });
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Mobile menu functionality
function initializeMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.querySelector('.main-nav');
    
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking on a link
    document.querySelectorAll('.main-nav a').forEach(link => {
        link.addEventListener('click', () => {
            if (mainNav) mainNav.classList.remove('active');
            if (menuToggle) menuToggle.classList.remove('active');
        });
    });
}

// Consultation form functionality
function initializeConsultationForm() {
    const form = document.getElementById('consultationForm');
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const name = formData.get('name');
            const phone = formData.get('phone');
            
            // Here you would typically send the data to a server
            console.log('Consultation request:', { name, phone });
            
            showNotification('Заявка отправлена! Мы свяжемся с вами в ближайшее время.', 'success');
            form.reset();
        });
    }
}

// Utility functions
function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0
    }).format(price);
}

function showNotification(message, type = 'success') {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle"></i>
            ${message}
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Make functions available globally
window.showProductModal = showProductModal;
window.formatPrice = formatPrice;
window.showNotification = showNotification;