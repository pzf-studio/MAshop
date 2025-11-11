class DataManager {
    constructor() {
        this.products = [];
        this.sections = [];
        this.apiBaseUrl = '/api';
        this.useAPI = false; // Временно отключаем API до развертывания бэкенда
        this.init();
    }

    async init() {
        if (this.useAPI) {
            await this.loadFromAPI();
        } else {
            this.loadFromLocalStorage();
        }
        this.setupSync();
    }

    async loadFromAPI() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/products?active_only=true`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            if (data.success) {
                this.products = data.products;
                this.saveToLocalStorage();
                console.log(`DataManager: Загружено ${this.products.length} товаров из API`);
            } else {
                throw new Error(data.error || 'Ошибка загрузки данных');
            }
        } catch (error) {
            console.error('DataManager: Ошибка загрузки из API:', error);
            console.log('DataManager: Переключаемся на localStorage...');
            this.loadFromLocalStorage();
        }
    }

    loadFromLocalStorage() {
        try {
            // Пробуем загрузить из adminProducts (админ-панель)
            const adminProducts = JSON.parse(localStorage.getItem('adminProducts')) || [];
            const localProducts = JSON.parse(localStorage.getItem('products')) || [];
            
            // Приоритет у adminProducts, если они есть
            if (adminProducts.length > 0) {
                this.products = this.transformAdminProducts(adminProducts);
                console.log(`DataManager: Загружено ${this.products.length} товаров из adminProducts`);
            } else if (localProducts.length > 0) {
                this.products = localProducts;
                console.log(`DataManager: Загружено ${this.products.length} товаров из localStorage`);
            } else {
                console.log('DataManager: Нет данных о товарах, инициализируем демо-данные');
                this.initializeDemoData();
            }
        } catch (error) {
            console.error('DataManager: Ошибка загрузки из localStorage:', error);
            this.initializeDemoData();
        }
    }

    transformAdminProducts(adminProducts) {
        return adminProducts.map(product => ({
            id: product.id,
            name: product.name,
            price: product.price,
            category: product.category,
            section: product.section || 'all',
            description: product.description || 'Описание товара',
            badge: product.badge,
            active: product.active !== false,
            featured: product.featured || false,
            stock: product.stock || 0,
            sku: product.sku || `MF-${product.id}`,
            images: product.images || [],
            features: Array.isArray(product.features) ? product.features : [],
            specifications: typeof product.specifications === 'object' ? product.specifications : {},
            createdAt: product.createdAt || new Date().toISOString(),
            updatedAt: product.updatedAt || new Date().toISOString()
        }));
    }

    initializeDemoData() {
        this.products = [
            {
                id: 1,
                name: 'Электрический пантограф премиум',
                price: 45000,
                category: 'pantograph',
                section: 'premium',
                description: 'Электрический пантограф с сенсорным управлением в премиальной отделке',
                badge: 'Хит продаж',
                active: true,
                featured: true,
                stock: 5,
                sku: 'MF-PANT-001',
                images: ['./images/1.png'],
                features: ['Сенсорное управление', 'Итальянская экокожа', 'Тихий электромотор'],
                specifications: {
                    'Материал': 'Анодированный алюминий',
                    'Цвет': 'Хром',
                    'Нагрузка': 'до 25 кг'
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 2,
                name: 'Система хранения гардеробная',
                price: 25000,
                category: 'wardrobe',
                section: 'classic',
                description: 'Ящики и органайзеры с корпусами из анодированного алюминия',
                badge: 'Новинка',
                active: true,
                featured: true,
                stock: 8,
                sku: 'MF-WARD-001',
                images: ['./images/2.jpeg'],
                features: ['Анодированный алюминий', 'Плавное выдвижение', 'Регулируемые полки'],
                specifications: {
                    'Материал': 'Алюминий + экокожа',
                    'Размеры': '60x40x20 см',
                    'Вес': '12 кг'
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        
        this.saveToLocalStorage();
        console.log('DataManager: Инициализированы демо-данные');
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('products', JSON.stringify(this.products));
        } catch (error) {
            console.error('DataManager: Ошибка сохранения в localStorage:', error);
        }
    }

    setupSync() {
        // Слушаем события обновления из админ-панели
        window.addEventListener('adminProductsUpdated', () => {
            console.log('DataManager: Обнаружено обновление в админ-панели');
            this.loadFromLocalStorage();
            this.notifyUpdate();
        });

        // Периодическая синхронизация (только если используем API)
        if (this.useAPI) {
            setInterval(() => {
                this.loadFromAPI();
            }, 30000);
        }
    }

    notifyUpdate() {
        const event = new CustomEvent('productsDataUpdated', {
            detail: { products: this.products }
        });
        window.dispatchEvent(event);
    }

    getProducts() {
        return this.products;
    }

    getActiveProducts() {
        return this.products.filter(product => product.active);
    }

    getProductById(id) {
        return this.products.find(product => product.id === parseInt(id));
    }

    getProductsByCategory(category) {
        return this.getActiveProducts().filter(product => product.category === category);
    }

    getProductsBySection(section) {
        return this.getActiveProducts().filter(product => product.section === section);
    }

    getFeaturedProducts(limit = 8) {
        return this.getActiveProducts()
            .filter(product => product.featured)
            .slice(0, limit);
    }

    getRandomProducts(limit = 3) {
        const activeProducts = this.getActiveProducts();
        if (activeProducts.length === 0) return [];
        
        const shuffled = [...activeProducts].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, limit);
    }

    async submitOrder(orderData) {
        if (this.useAPI) {
            try {
                const response = await fetch(`${this.apiBaseUrl}/orders`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(orderData)
                });

                const result = await response.json();
                return result;
            } catch (error) {
                console.error('Ошибка оформления заказа через API:', error);
                return this.fallbackOrderSubmit(orderData);
            }
        } else {
            return this.fallbackOrderSubmit(orderData);
        }
    }

    fallbackOrderSubmit(orderData) {
        // Fallback: отправка через Telegram
        try {
            const message = this.formatOrderMessage(orderData);
            const telegramUrl = `https://t.me/Ma_Furniture_ru?text=${encodeURIComponent(message)}`;
            window.open(telegramUrl, '_blank');
            
            return { success: true, telegram_sent: true, message: 'Заказ открыт в Telegram' };
        } catch (error) {
            console.error('Ошибка fallback оформления заказа:', error);
            return { success: false, error: 'Ошибка оформления заказа' };
        }
    }

    formatOrderMessage(orderData) {
        let message = '🛒 НОВЫЙ ЗАКАЗ MA FURNITURE\n\n';
        
        orderData.items.forEach((item, index) => {
            message += `${index + 1}. ${item.name}\n`;
            message += `   Количество: ${item.quantity} шт.\n`;
            message += `   Цена за шт: ${this.formatPrice(item.price)}\n`;
            message += `   Сумма: ${this.formatPrice(item.price * item.quantity)}\n\n`;
        });
        
        message += `💰 ОБЩАЯ СУММА: ${this.formatPrice(orderData.total)}\n\n`;
        
        if (orderData.customer_name) {
            message += `👤 Клиент: ${orderData.customer_name}\n`;
        }
        if (orderData.customer_phone) {
            message += `📞 Телефон: ${orderData.customer_phone}\n`;
        }
        if (orderData.customer_email) {
            message += `📧 Email: ${orderData.customer_email}\n`;
        }
        
        message += `📅 ${new Date().toLocaleString('ru-RU')}`;
        
        return message;
    }

    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0
        }).format(price);
    }
}

const dataManager = new DataManager();