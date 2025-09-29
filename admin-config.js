const AdminConfig = {
    SESSION_TIMEOUT: 2 * 60 * 60 * 1000, // 2 часа
    MAX_LOGIN_ATTEMPTS: 5,
    LOGIN_BLOCK_TIME: 30 * 60 * 1000, // 30 минут
    PASSWORD_MIN_LENGTH: 8,
    MAX_PRODUCTS: 45,
    
    // В реальном приложении это должно быть на сервере
    VALID_CREDENTIALS: {
        username: 'admin',
        password: 'admin123' // В реальном приложении используйте хеширование!
    },
    
    // Категории товаров
    CATEGORIES: {
        'pantograph': 'Пантографы',
        'wardrobe': 'Гардеробные системы',
        'premium': 'Премиум коллекция'
    },
    
    // Бейджи товаров
    BADGES: {
        '': 'Без бейджа',
        'Хит продаж': 'Хит продаж',
        'Новинка': 'Новинка'
    }
};