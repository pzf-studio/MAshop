// shop.js - Интернет-магазин MA Furniture
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    console.log('Initializing MA Furniture Shop...');
    initializeProducts();
    initializeFilters();
    initializeModal();
    initializeMobileMenu();
    initializeConsultationForm();
    
    // Слушатель обновлений товаров
    window.addEventListener('productsUpdated', (event) => {
        console.log('Товары обновлены через кастомное событие');
        if (typeof initializeProducts === 'function') {
            initializeProducts();
        }
    });
    
    // Слушатель обновлений разделов
    window.addEventListener('sectionsUpdated', (event) => {
        console.log('Разделы обновлены через кастомное событие');
        if (typeof initializeFilters === 'function') {
            initializeFilters();
        }
    });
}

// Products and pagination functionality
function initializeProducts() {
    const productsGrid = document.getElementById('productsGrid');
    const pagination = document.getElementById('pagination');
    const itemsPerPage = 15;
    let currentPage = 1;
    let currentFilter = 'all';

    // Улучшенная функция получения товаров
    function getActiveProducts() {
        let products = [];
        
        try {
            // Пробуем сначала получить товары из админки
            const adminProducts = JSON.parse(localStorage.getItem('adminProducts')) || [];
            
            if (adminProducts.length > 0) {
                // Конвертируем товары из админки в формат магазина
                products = adminProducts.map(product => ({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    category: product.category,
                    section: product.section || 'all',
                    description: product.description,
                    badge: product.badge,
                    active: product.active,
                    featured: product.featured || false,
                    stock: product.stock || 0,
                    sku: product.sku,
                    images: product.images || [],
                    features: product.features || [],
                    specifications: product.specifications || {},
                    createdAt: product.createdAt,
                    updatedAt: product.updatedAt
                }));
                
                // Сохраняем синхронизированные товары
                localStorage.setItem('products', JSON.stringify(products));
                console.log('Товары загружены из админки:', products.length);
            } else {
                // Если в админке нет товаров, используем стандартные
                products = JSON.parse(localStorage.getItem('products')) || [];
                console.log('Товары загружены из магазина:', products.length);
            }
        } catch (error) {
            console.error('Load products error:', error);
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
                    <a href="https://t.me/Ma_Furniture_ru" class="btn btn-primary" target="_blank">
                        Заказать в Telegram
                    </a>
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
        
        if (pagination) {
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
    }

    // Attach event listeners to product buttons
    function attachProductEventListeners() {
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
        const sections = JSON.parse(localStorage.getItem('sections')) || getDefaultSections();
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

    // Обработка URL параметров
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

    // Initial render
    renderProducts();
    handleUrlFilters();
}

// Modal functionality
function initializeModal() {
    const modal = document.getElementById('productModal');
    const closeBtn = document.getElementById('modalClose');
    
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
    
    const modal = document.getElementById('productModal');
    if (!modal) return;
    
    const modalBody = document.getElementById('modalBody');
    
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
    
    modalBody.innerHTML = `
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
                <a href="https://t.me/Ma_Furniture_ru" class="btn btn-primary" target="_blank">
                    <i class="fab fa-telegram-plane"></i> Заказать в Telegram
                </a>
                <button class="btn btn-outline">
                    <i class="far fa-heart"></i>
                </button>
            </div>
        </div>
    `;
    
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