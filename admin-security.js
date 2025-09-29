// Дополнительные функции безопасности

// Защита от CSRF
function generateCSRFToken() {
    const token = 'csrf_' + Math.random().toString(36).substr(2) + Date.now().toString(36);
    sessionStorage.setItem('csrfToken', token);
    return token;
}

function validateCSRFToken(token) {
    const storedToken = sessionStorage.getItem('csrfToken');
    return storedToken && storedToken === token;
}

// Логирование действий администратора
function logAdminAction(action, details = {}) {
    const logs = JSON.parse(localStorage.getItem('adminLogs') || '[]');
    const logEntry = {
        timestamp: new Date().toISOString(),
        action: action,
        details: details,
        user: 'admin' // В реальном приложении - ID пользователя
    };
    
    logs.unshift(logEntry);
    
    // Храним только последние 100 записей
    if (logs.length > 100) {
        logs.pop();
    }
    
    localStorage.setItem('adminLogs', JSON.stringify(logs));
}

// Ограничение попыток входа
function setupLoginSecurity() {
    const loginAttempts = localStorage.getItem('loginAttempts') || 0;
    const lastAttempt = localStorage.getItem('lastLoginAttempt') || 0;
    const blockUntil = localStorage.getItem('blockUntil') || 0;
    
    // Проверяем блокировку
    if (Date.now() < blockUntil) {
        const minutesLeft = Math.ceil((blockUntil - Date.now()) / (60 * 1000));
        throw new Error(`Слишком много попыток входа. Попробуйте через ${minutesLeft} минут.`);
    }
    
    // Сбрасываем счетчик если прошло больше 15 минут
    if (Date.now() - lastAttempt > 15 * 60 * 1000) {
        localStorage.setItem('loginAttempts', 0);
    }
}

function handleFailedLogin() {
    const attempts = parseInt(localStorage.getItem('loginAttempts') || 0) + 1;
    localStorage.setItem('loginAttempts', attempts);
    localStorage.setItem('lastLoginAttempt', Date.now());
    
    if (attempts >= 5) {
        // Блокируем на 30 минут после 5 неудачных попыток
        const blockUntil = Date.now() + (30 * 60 * 1000);
        localStorage.setItem('blockUntil', blockUntil);
        throw new Error('Слишком много неудачных попыток. Аккаунт заблокирован на 30 минут.');
    }
}

function handleSuccessfulLogin() {
    localStorage.removeItem('loginAttempts');
    localStorage.removeItem('lastLoginAttempt');
    localStorage.removeItem('blockUntil');
}

// Функция для получения активных товаров (для синхронизации с магазином)
function getActiveProducts() {
    let products = [];
    
    try {
        products = JSON.parse(localStorage.getItem('products')) || [];
    } catch (error) {
        console.error('Load products error:', error);
        products = [];
    }
    
    // Фильтруем только активные товары
    return products.filter(product => product.active === true);
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