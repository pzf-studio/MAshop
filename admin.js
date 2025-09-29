// Admin Panel JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeAdminPanel();
});

// Security Configuration
const AdminConfig = {
    SESSION_TIMEOUT: 2 * 60 * 60 * 1000, // 2 часа
    MAX_LOGIN_ATTEMPTS: 5,
    LOGIN_BLOCK_TIME: 30 * 60 * 1000, // 30 минут
    MAX_PRODUCTS: 45,
    
    VALID_CREDENTIALS: {
        username: 'admin',
        password: 'admin123'
    }
};

// Security Middleware
function checkAdminAuth() {
    const session = localStorage.getItem('adminSession');
    
    if (!session) {
        redirectToLogin();
        return false;
    }
    
    try {
        const sessionData = JSON.parse(session);
        
        // Проверяем срок действия сессии
        if (sessionData.expires < Date.now()) {
            localStorage.removeItem('adminSession');
            showNotification('Сессия истекла', 'error');
            redirectToLogin();
            return false;
        }
        
        // Проверяем валидность токена
        if (!sessionData.token || !sessionData.token.startsWith('token_')) {
            localStorage.removeItem('adminSession');
            redirectToLogin();
            return false;
        }
        
        // Обновляем время сессии при активности
        sessionData.expires = Date.now() + AdminConfig.SESSION_TIMEOUT;
        localStorage.setItem('adminSession', JSON.stringify(sessionData));
        
        return true;
    } catch (error) {
        console.error('Session error:', error);
        localStorage.removeItem('adminSession');
        redirectToLogin();
        return false;
    }
}

function redirectToLogin() {
    window.location.href = 'admin-login.html';
}

function logout() {
    logAdminAction('logout');
    localStorage.removeItem('adminSession');
    showNotification('Вы вышли из системы', 'success');
    setTimeout(() => {
        redirectToLogin();
    }, 1000);
}

function generateSessionToken() {
    return 'token_' + Math.random().toString(36).substr(2) + Date.now().toString(36);
}

// XSS Protection
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Input Validation
function validateProductData(productData) {
    const errors = [];
    
    if (!productData.name || productData.name.trim().length === 0) {
        errors.push('Название товара обязательно');
    }
    
    if (!productData.price || productData.price <= 0) {
        errors.push('Цена должна быть положительным числом');
    }
    
    if (!productData.category) {
        errors.push('Категория обязательна');
    }
    
    if (productData.name && productData.name.length > 100) {
        errors.push('Название товара слишком длинное');
    }
    
    if (productData.description && productData.description.length > 1000) {
        errors.push('Описание слишком длинное');
    }
    
    return errors;
}

// Admin Logging
function logAdminAction(action, details = {}) {
    try {
        const logs = JSON.parse(localStorage.getItem('adminLogs') || '[]');
        const logEntry = {
            timestamp: new Date().toISOString(),
            action: action,
            details: details,
            userAgent: navigator.userAgent,
            ip: 'local'
        };
        
        logs.unshift(logEntry);
        
        // Храним только последние 100 записей
        if (logs.length > 100) {
            logs.pop();
        }
        
        localStorage.setItem('adminLogs', JSON.stringify(logs));
    } catch (error) {
        console.error('Logging error:', error);
    }
}

// Activity Monitor
function setupActivityMonitor() {
    let activityTimer;
    
    const resetTimer = () => {
        clearTimeout(activityTimer);
        activityTimer = setTimeout(() => {
            if (confirm('Сессия будет завершена из-за неактивности. Продолжить?')) {
                resetTimer();
            } else {
                logout();
            }
        }, 30 * 60 * 1000); // 30 минут неактивности
    };
    
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    activityEvents.forEach(event => {
        document.addEventListener(event, resetTimer, false);
    });
    
    resetTimer();
}

function initializeAdminPanel() {
    // Проверяем авторизацию
    if (!checkAdminAuth()) {
        return;
    }
    
    // Инициализация кнопки выхода
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
    
    // Мониторинг активности
    setupActivityMonitor();
    
    // Логируем вход
    logAdminAction('login');
    
    // Инициализация компонентов
    initializeTabs();
    initializeProductManagement();
    initializeModal();
    initializeMobileMenu();
    loadProducts();
}

// Tabs functionality
function initializeTabs() {
    const tabs = document.querySelectorAll('.admin-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            if (!checkAdminAuth()) return;
            
            const tabId = tab.dataset.tab;
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show corresponding content
            document.querySelectorAll('.admin-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabId}Tab`).classList.add('active');
            
            logAdminAction('tab_switch', { tab: tabId });
        });
    });
}

// Product management
function initializeProductManagement() {
    const addProductBtn = document.getElementById('addProductBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const productForm = document.getElementById('productForm');
    const cancelBtn = document.getElementById('cancelBtn');
    const badgeOptions = document.querySelectorAll('.badge-option');
    
    // Add product button
    addProductBtn.addEventListener('click', () => {
        if (!checkAdminAuth()) return;
        showProductModal();
    });
    
    // Refresh button
    refreshBtn.addEventListener('click', () => {
        if (!checkAdminAuth()) return;
        loadProducts();
        showNotification('Данные обновлены');
        logAdminAction('refresh_products');
    });
    
    // Product form submission
    productForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!checkAdminAuth()) return;
        saveProduct();
    });
    
    // Cancel button
    cancelBtn.addEventListener('click', () => {
        hideProductModal();
    });
    
    // Badge selection
    badgeOptions.forEach(option => {
        option.addEventListener('click', () => {
            badgeOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            document.getElementById('productBadge').value = option.dataset.badge;
        });
    });
}

// Modal functionality
function initializeModal() {
    const modal = document.getElementById('productModal');
    const modalClose = document.getElementById('modalClose');
    const confirmModal = document.getElementById('confirmModal');
    const cancelDelete = document.getElementById('cancelDelete');
    
    modalClose.addEventListener('click', () => {
        hideProductModal();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideProductModal();
        }
    });
    
    cancelDelete.addEventListener('click', () => {
        confirmModal.classList.remove('active');
    });
    
    confirmModal.addEventListener('click', (e) => {
        if (e.target === confirmModal) {
            confirmModal.classList.remove('active');
        }
    });
}

// Mobile menu
function initializeMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.querySelector('.main-nav');
    
    menuToggle.addEventListener('click', () => {
        mainNav.classList.toggle('active');
        menuToggle.classList.toggle('active');
    });
}

// Load products from localStorage
function loadProducts() {
    if (!checkAdminAuth()) return;
    
    const products = getProducts();
    const tableBody = document.getElementById('productsTableBody');
    
    tableBody.innerHTML = '';
    
    if (products.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: #666;">
                    <i class="fas fa-box-open" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                    Нет товаров
                </td>
            </tr>
        `;
        return;
    }
    
    // Сортируем товары по ID для удобства
    products.sort((a, b) => a.id - b.id);
    
    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${escapeHtml(product.name)}</td>
            <td>${escapeHtml(getCategoryName(product.category))}</td>
            <td>${formatPrice(product.price)}</td>
            <td>${escapeHtml(product.badge || '-')}</td>
            <td>
                <span class="status-badge ${product.active ? 'active' : 'inactive'}">
                    ${product.active ? 'Активен' : 'Неактивен'}
                </span>
            </td>
            <td>
                <div class="product-actions">
                    <button class="btn-toggle-active ${product.active ? 'btn-deactivate' : 'btn-activate'}" 
                            data-id="${product.id}" 
                            data-active="${product.active}">
                        <i class="fas fa-${product.active ? 'eye-slash' : 'eye'}"></i>
                        ${product.active ? 'Скрыть' : 'Показать'}
                    </button>
                    <button class="btn-edit" data-id="${product.id}">
                        <i class="fas fa-edit"></i> Изменить
                    </button>
                    <button class="btn-delete" data-id="${product.id}">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Attach event listeners to action buttons
    attachProductActionListeners();
}

// Attach event listeners to product action buttons
function attachProductActionListeners() {
    // Edit buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (!checkAdminAuth()) return;
            const productId = parseInt(e.target.closest('.btn-edit').dataset.id);
            editProduct(productId);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (!checkAdminAuth()) return;
            const productId = parseInt(e.target.closest('.btn-delete').dataset.id);
            confirmDelete(productId);
        });
    });
    
    // Toggle active buttons
    document.querySelectorAll('.btn-toggle-active').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (!checkAdminAuth()) return;
            const productId = parseInt(e.target.closest('.btn-toggle-active').dataset.id);
            const isActive = e.target.closest('.btn-toggle-active').dataset.active === 'true';
            toggleProductActive(productId, !isActive);
        });
    });
}

// Show product modal for adding/editing
function showProductModal(product = null) {
    if (!checkAdminAuth()) return;
    
    const modal = document.getElementById('productModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('productForm');
    
    if (product) {
        // Edit mode
        modalTitle.textContent = 'Редактировать товар';
        populateForm(product);
        logAdminAction('edit_product_open', { productId: product.id });
    } else {
        // Add mode
        modalTitle.textContent = 'Добавить товар';
        form.reset();
        document.getElementById('productId').value = '';
        document.getElementById('productActive').checked = true;
        document.querySelectorAll('.badge-option').forEach(opt => {
            opt.classList.remove('selected');
            if (opt.dataset.badge === '') {
                opt.classList.add('selected');
            }
        });
        logAdminAction('add_product_open');
    }
    
    modal.classList.add('active');
}

// Hide product modal
function hideProductModal() {
    const modal = document.getElementById('productModal');
    modal.classList.remove('active');
}

// Populate form with product data
function populateForm(product) {
    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productBadge').value = product.badge || '';
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productActive').checked = product.active !== false;
    
    // Select correct badge option
    document.querySelectorAll('.badge-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.badge === (product.badge || '')) {
            opt.classList.add('selected');
        }
    });
}

// Save product (add or update)
function saveProduct() {
    if (!checkAdminAuth()) return;
    
    const form = document.getElementById('productForm');
    const productId = document.getElementById('productId').value;
    const products = getProducts();
    
    const productData = {
        name: document.getElementById('productName').value.trim(),
        price: parseInt(document.getElementById('productPrice').value),
        category: document.getElementById('productCategory').value,
        badge: document.getElementById('productBadge').value || undefined,
        description: document.getElementById('productDescription').value.trim() || '',
        active: document.getElementById('productActive').checked
    };
    
    // Валидация данных
    const validationErrors = validateProductData(productData);
    if (validationErrors.length > 0) {
        showNotification(validationErrors.join(', '), 'error');
        return;
    }
    
    if (productId) {
        // Update existing product
        const index = products.findIndex(p => p.id === parseInt(productId));
        if (index !== -1) {
            const oldProduct = products[index];
            products[index] = { ...products[index], ...productData };
            showNotification('Товар успешно обновлен');
            logAdminAction('product_updated', { 
                productId: productId,
                oldData: oldProduct,
                newData: products[index]
            });
        }
    } else {
        // Add new product
        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        
        // Проверяем лимит товаров
        if (products.length >= AdminConfig.MAX_PRODUCTS) {
            showNotification(`Достигнут лимит товаров (${AdminConfig.MAX_PRODUCTS})`, 'error');
            return;
        }
        
        const newProduct = {
            id: newId,
            ...productData
        };
        products.push(newProduct);
        showNotification('Товар успешно добавлен');
        logAdminAction('product_added', { product: newProduct });
    }
    
    // Save to localStorage
    try {
        localStorage.setItem('products', JSON.stringify(products));
    } catch (error) {
        console.error('Save error:', error);
        showNotification('Ошибка сохранения данных', 'error');
        return;
    }
    
    // Синхронизируем данные с магазином
    syncProductsData();
    
    // Reload products and close modal
    loadProducts();
    hideProductModal();
}

// Edit product
function editProduct(productId) {
    if (!checkAdminAuth()) return;
    
    const products = getProducts();
    const product = products.find(p => p.id === productId);
    
    if (product) {
        showProductModal(product);
    }
}

// Confirm delete
function confirmDelete(productId) {
    if (!checkAdminAuth()) return;
    
    const confirmModal = document.getElementById('confirmModal');
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    
    // Remove existing event listener
    const newConfirmDeleteBtn = confirmDeleteBtn.cloneNode(true);
    confirmDeleteBtn.parentNode.replaceChild(newConfirmDeleteBtn, confirmDeleteBtn);
    
    // Add new event listener
    newConfirmDeleteBtn.addEventListener('click', () => {
        if (!checkAdminAuth()) return;
        deleteProduct(productId);
        confirmModal.classList.remove('active');
    });
    
    confirmModal.classList.add('active');
}

// Delete product
function deleteProduct(productId) {
    if (!checkAdminAuth()) return;
    
    let products = getProducts();
    const productToDelete = products.find(p => p.id === productId);
    
    if (!productToDelete) {
        showNotification('Товар не найден', 'error');
        return;
    }
    
    products = products.filter(p => p.id !== productId);
    
    // Save to localStorage
    try {
        localStorage.setItem('products', JSON.stringify(products));
    } catch (error) {
        console.error('Delete error:', error);
        showNotification('Ошибка удаления товара', 'error');
        return;
    }
    
    // Синхронизируем данные с магазином
    syncProductsData();
    
    // Reload products
    loadProducts();
    showNotification('Товар успешно удален');
    
    // Логируем удаление
    logAdminAction('product_deleted', { product: productToDelete });
}

// Toggle product active status
function toggleProductActive(productId, isActive) {
    if (!checkAdminAuth()) return;
    
    const products = getProducts();
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex !== -1) {
        products[productIndex].active = isActive;
        
        try {
            localStorage.setItem('products', JSON.stringify(products));
            
            // Синхронизируем данные с магазином
            syncProductsData();
            
            loadProducts();
            showNotification(`Товар ${isActive ? 'активирован' : 'деактивирован'}`);
            logAdminAction('product_toggle_active', { 
                productId: productId, 
                active: isActive 
            });
        } catch (error) {
            console.error('Toggle active error:', error);
            showNotification('Ошибка обновления товара', 'error');
        }
    }
}

// Get products from localStorage or use default data
function getProducts() {
    if (!checkAdminAuth()) return [];
    
    let products = [];
    
    try {
        products = JSON.parse(localStorage.getItem('products')) || [];
    } catch (error) {
        console.error('Load products error:', error);
        products = [];
    }
    
    // Если нет товаров в localStorage, создаем начальные данные
    if (!products || products.length === 0) {
        products = createDefaultProducts();
        
        try {
            localStorage.setItem('products', JSON.stringify(products));
        } catch (error) {
            console.error('Save default products error:', error);
        }
    }
    
    return products;
}

// Create default products (45 товаров)
function createDefaultProducts() {
    const products = [
        { id: 1, name: "Пантограф Classic Gold", price: 45990, category: "pantograph", badge: "Хит продаж", active: true },
        { id: 2, name: "Пантограф Modern Silver", price: 32990, category: "pantograph", active: true },
        { id: 3, name: "Гардеробная система Lux", price: 89990, category: "wardrobe", badge: "Новинка", active: true },
        { id: 4, name: "Премиум гарнитур Imperial", price: 125990, category: "premium", active: true },
        { id: 5, name: "Гардеробная система Comfort", price: 75990, category: "wardrobe", active: true },
        { id: 6, name: "Пантограф Elegance", price: 56990, category: "pantograph", active: true },
        { id: 7, name: "Премиум комплект Royal", price: 98990, category: "premium", badge: "Хит продаж", active: true },
        { id: 8, name: "Пантограф Minimal", price: 42990, category: "pantograph", active: true },
        { id: 9, name: "Гардеробная система Smart", price: 67990, category: "wardrobe", active: true },
        { id: 10, name: "Премиум набор Prestige", price: 112990, category: "premium", active: true },
        { id: 11, name: "Пантограф Compact", price: 38990, category: "pantograph", active: true },
        { id: 12, name: "Гардеробная система Pro", price: 82990, category: "wardrobe", badge: "Новинка", active: true },
        { id: 13, name: "Премиум коллекция Elite", price: 95990, category: "premium", active: true },
        { id: 14, name: "Пантограф Standard", price: 49990, category: "pantograph", active: true },
        { id: 15, name: "Гардеробная система Basic", price: 72990, category: "wardrobe", active: true }
    ];
    
    // Добавляем остальные 30 товаров (неактивных по умолчанию)
    for (let i = 16; i <= 45; i++) {
        const categories = ["pantograph", "wardrobe", "premium"];
        const category = categories[Math.floor(Math.random() * categories.length)];
        
        products.push({
            id: i,
            name: `Товар ${i}`,
            price: Math.floor(Math.random() * 50000) + 20000,
            category: category,
            active: false // Новые товары по умолчанию неактивны
        });
    }
    
    return products;
}

// Синхронизация данных с магазином
function syncProductsData() {
    const adminProducts = getProducts();
    const activeProducts = adminProducts.filter(product => product.active);
    
    // Отправляем сообщение об обновлении если магазин открыт
    if (window.opener && !window.opener.closed) {
        try {
            window.opener.postMessage({
                type: 'PRODUCTS_UPDATED',
                products: activeProducts
            }, '*');
        } catch (error) {
            console.error('Sync error:', error);
        }
    }
    
    return activeProducts;
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
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

function showNotification(message, type = 'success') {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}"></i>
            <span>${escapeHtml(message)}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// Session cleanup on page unload
window.addEventListener('beforeunload', () => {
    // Можно добавить дополнительную логику очистки при необходимости
});

// Prevent right-click in admin panel (опционально)
document.addEventListener('contextmenu', (e) => {
    if (window.location.pathname.includes('admin.html')) {
        e.preventDefault();
        return false;
    }
});

// Export functions for login page (если нужно)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        checkAdminAuth,
        generateSessionToken,
        validateProductData,
        escapeHtml
    };
}