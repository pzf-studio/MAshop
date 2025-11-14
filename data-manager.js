// Встроенный TelegramService - ОСТАВЛЯЕМ ТОЛЬКО ЭТОТ
class TelegramService {
    constructor() {
        this.botToken = '8595614348:AAFSrVFLjI7o_FS-36DTDDLgGlGgSD03jLY';
        this.chatId = '743619189';
        this.apiUrl = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
    }

    async sendOrder(orderData) {
        try {
            const message = this.formatOrderMessage(orderData);
            
            console.log('Отправка запроса к Telegram API...');
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: this.chatId,
                    text: message,
                    parse_mode: 'HTML'
                })
            });

            const result = await response.json();
            
            if (result.ok) {
                console.log('Заказ успешно отправлен в Telegram');
                return {
                    success: true,
                    message_id: result.result.message_id,
                    telegram_sent: true
                };
            } else {
                console.error('Telegram API ошибка:', result);
                throw new Error(result.description || `Ошибка Telegram API: ${result.error_code}`);
            }
        } catch (error) {
            console.error('Ошибка отправки в Telegram:', error);
            throw error;
        }
    }

    formatOrderMessage(orderData) {
        const formatPrice = (price) => {
            return new Intl.NumberFormat('ru-RU', {
                style: 'currency',
                currency: 'RUB',
                minimumFractionDigits: 0
            }).format(price);
        };

        let message = `<b>🛒 НОВЫЙ ЗАКАЗ MA FURNITURE</b>\n\n`;
        
        // Информация о товарах
        message += `<b>📦 Состав заказа:</b>\n`;
        orderData.items.forEach((item, index) => {
            message += `${index + 1}. <b>${this.escapeHtml(item.name)}</b>\n`;
            message += `   Количество: ${item.quantity} шт.\n`;
            message += `   Цена за шт: ${formatPrice(item.price)}\n`;
            message += `   Сумма: ${formatPrice(item.price * item.quantity)}\n\n`;
        });
        
        message += `<b>💰 ОБЩАЯ СУММА: ${formatPrice(orderData.total)}</b>\n\n`;
        
        // Информация о клиенте
        message += `<b>👤 Данные клиента:</b>\n`;
        message += `ФИО: ${this.escapeHtml(orderData.customer_name)}\n`;
        message += `Телефон: ${this.escapeHtml(orderData.customer_phone)}\n`;
        
        if (orderData.customer_email) {
            message += `Email: ${this.escapeHtml(orderData.customer_email)}\n`;
        }
        
        if (orderData.customer_address) {
            message += `Адрес: ${this.escapeHtml(orderData.customer_address)}\n`;
        }
        
        if (orderData.customer_comment) {
            message += `Комментарий: ${this.escapeHtml(orderData.customer_comment)}\n`;
        }
        
        message += `\n📅 ${new Date().toLocaleString('ru-RU')}`;
        message += `\n\n🌐 <i>Заказ с сайта: MA Furniture</i>`;
        
        return message;
    }

    escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

// Создаем глобальный экземпляр
const telegramService = new TelegramService();

class DataManager {
    constructor() {
        this.products = [];
        this.sections = [];
        this.apiBaseUrl = '/api';
        this.useAPI = false;
        this.telegramService = telegramService;
        this.init();
    }

    async init() {
        await this.loadFromLocalStorage();
        this.setupSync();
        
        const health = await this.checkAPIHealth();
        console.log('DataManager: Статус API для заказов:', health);
    }

    async loadFromLocalStorage() {
        try {
            console.log('DataManager: Загрузка данных из localStorage...');
            
            // Сначала пробуем загрузить из adminProducts (админ-панель) - ПРИОРИТЕТ
            const adminProducts = JSON.parse(localStorage.getItem('adminProducts')) || [];
            const localProducts = JSON.parse(localStorage.getItem('products')) || [];
            
            console.log('DataManager: adminProducts найдено:', adminProducts.length);
            console.log('DataManager: localProducts найдено:', localProducts.length);
            
            // Приоритет у adminProducts, если они есть
            if (adminProducts.length > 0) {
                this.products = this.transformAdminProducts(adminProducts);
                console.log(`DataManager: Загружено ${this.products.length} товаров из adminProducts`);
                // Сохраняем преобразованные товары в products для совместимости
                this.saveToLocalStorage();
            } else if (localProducts.length > 0) {
                this.products = localProducts;
                console.log(`DataManager: Загружено ${this.products.length} товаров из localStorage`);
            } else {
                console.log('DataManager: Нет данных о товарах, инициализируем демо-данные');
                this.initializeDemoData();
            }
            
            // Загружаем разделы из админки
            await this.loadSections();
            
            // Уведомляем о загрузке данных
            this.notifyUpdate();
            
        } catch (error) {
            console.error('DataManager: Ошибка загрузки из localStorage:', error);
            this.initializeDemoData();
        }
    }
    
    async loadSections() {
        try {
            this.sections = JSON.parse(localStorage.getItem('adminSections')) || [];
            console.log('DataManager: Загружено разделов:', this.sections.length);
            
            if (this.sections.length === 0) {
                this.sections = [
                    { id: 1, name: 'Пантографы', code: 'pantograph', product_count: 0, active: true },
                    { id: 2, name: 'Nuomi Hera', code: 'nuomi-hera', product_count: 0, active: true },
                    { id: 3, name: 'Nuomi Ralphie', code: 'nuomi-ralphie', product_count: 0, active: true },
                    { id: 4, name: 'Коллекция Wise', code: 'wise', product_count: 0, active: true },
                    { id: 5, name: 'Коллекция Time', code: 'time', product_count: 0, active: true },
                    { id: 6, name: 'Кухонные лифты', code: 'kitchen', product_count: 0, active: true }
                ];
                this.saveSections();
            }
        } catch (error) {
            console.error('DataManager: Ошибка загрузки разделов:', error);
        }
    }

    transformAdminProducts(adminProducts) {
        console.log('DataManager: Преобразование adminProducts:', adminProducts.length);
        
        const transformedProducts = adminProducts.map(product => ({
            id: product.id,
            name: product.name,
            price: product.price,
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
            multipleColors: product.multipleColors || false,
            colorsCount: product.colorsCount || 1,
            isColorVariant: product.isColorVariant || false,
            originalProductId: product.originalProductId || null,
            colorIndex: product.colorIndex || null,
            colorVariants: product.colorVariants || [],
            colorName: product.colorName || null,
            colorHex: product.colorHex || null,
            createdAt: product.createdAt || new Date().toISOString(),
            updatedAt: product.updatedAt || new Date().toISOString()
        }));

        console.log('DataManager: Преобразовано товаров:', transformedProducts.length);
        return transformedProducts;
    }

    initializeDemoData() {
        console.log('DataManager: Инициализация демо-данных');
        this.products = [
            {
                id: 1,
                name: 'Электрический пантограф премиум',
                price: 45000,
                section: 'pantograph',
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
                multipleColors: true,
                colorVariants: [
                    {
                        name: 'Серебристый',
                        hex: '#cccccc',
                        images: ['./images/1.png'],
                        index: 1
                    },
                    {
                        name: 'Золотистый',
                        hex: '#FFD700',
                        images: ['./images/1.png'],
                        index: 2
                    }
                ],
                isColorVariant: false,
                originalProductId: null,
                colorIndex: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 2,
                name: 'Система хранения гардеробная',
                price: 25000,
                section: 'wise',
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
                multipleColors: false,
                colorsCount: 1,
                isColorVariant: false,
                originalProductId: null,
                colorIndex: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        
        this.createDemoColorVariants();
        this.saveToLocalStorage();
        console.log('DataManager: Инициализированы демо-данные');
    }

    createDemoColorVariants() {
        const mainProduct = this.products[0];
        
        if (mainProduct.colorVariants && mainProduct.colorVariants.length > 0) {
            mainProduct.colorVariants.forEach((colorVariant, index) => {
                const variant = {
                    ...mainProduct,
                    id: this.generateProductId(),
                    name: `${mainProduct.name} - ${colorVariant.name}`,
                    sku: `${mainProduct.sku}_${index + 1}`,
                    isColorVariant: true,
                    originalProductId: mainProduct.id,
                    colorIndex: index + 1,
                    colorName: colorVariant.name,
                    colorHex: colorVariant.hex,
                    images: colorVariant.images,
                    multipleColors: false,
                    colorsCount: 1,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                this.products.push(variant);
            });
        }
    }

    generateProductId() {
        const maxId = this.products.reduce((max, product) => Math.max(max, product.id), 0);
        return maxId + 1;
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('products', JSON.stringify(this.products));
            console.log('DataManager: Товары сохранены в localStorage');
        } catch (error) {
            console.error('DataManager: Ошибка сохранения в localStorage:', error);
        }
    }
    
    saveSections() {
        try {
            localStorage.setItem('adminSections', JSON.stringify(this.sections));
            console.log('DataManager: Разделы сохранены в localStorage');
        } catch (error) {
            console.error('DataManager: Ошибка сохранения разделов:', error);
        }
    }

    setupSync() {
        // Слушаем события обновления из админ-панели
        window.addEventListener('adminProductsUpdated', () => {
            console.log('DataManager: Обнаружено обновление в админ-панели');
            this.loadFromLocalStorage();
            this.notifyUpdate();
        });
        
        // Слушаем обновления разделов
        window.addEventListener('adminSectionsUpdated', () => {
            console.log('DataManager: Обновлены разделы');
            this.loadSections();
            this.notifyUpdate();
        });

        // Слушаем события синхронизации из sync.js
        window.addEventListener('productsUpdated', () => {
            console.log('DataManager: Обнаружена синхронизация товаров');
            this.loadFromLocalStorage();
            this.notifyUpdate();
        });

        if (this.useAPI) {
            setInterval(() => {
                this.loadFromAPI();
            }, 30000);
        }
    }

    notifyUpdate() {
        console.log('DataManager: Уведомление об обновлении данных');
        const event = new CustomEvent('productsDataUpdated', {
            detail: { products: this.products, sections: this.sections }
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

    getColorVariants(productId) {
        return this.products.filter(product => 
            product.isColorVariant && 
            product.originalProductId === productId && 
            product.active
        );
    }

    getMainProduct(variantId) {
        const variant = this.getProductById(variantId);
        if (variant && variant.isColorVariant) {
            return this.getProductById(variant.originalProductId);
        }
        return null;
    }
    
    getActiveSections() {
        return this.sections.filter(section => section.active);
    }

    // ОСНОВНОЙ МЕТОД ДЛЯ ОТПРАВКИ ЗАКАЗОВ
    async submitOrder(orderData) {
        console.log('DataManager: Начинаем отправку заказа', orderData);
        
        try {
            // Сначала пробуем отправить через Telegram API
            console.log('Попытка отправки через Telegram API...');
            const result = await this.telegramService.sendOrder(orderData);
            
            console.log('DataManager: Заказ успешно отправлен через Telegram:', result);
            return {
                success: true,
                telegram_sent: true,
                message: 'Заказ успешно отправлен! Мы свяжемся с вами в ближайшее время.'
            };
            
        } catch (error) {
            console.error('DataManager: Ошибка при отправке заказа в Telegram:', error);
            
            // Если Telegram API не работает, используем fallback - открываем Telegram с сообщением
            console.log('Используем fallback метод...');
            return { 
                success: true, // Все равно считаем успешным, т.к. есть fallback
                telegram_sent: false,
                fallback_used: true,
                message: 'Заказ подготовлен для отправки в Telegram',
                fallback_available: true,
                fallback_message: 'Нажмите кнопку ниже чтобы отправить заказ в Telegram',
                fallback_action: () => this.openTelegramFallback(orderData)
            };
        }
    }

    openTelegramFallback(orderData) {
        try {
            const message = this.formatOrderMessage(orderData);
            const telegramUrl = `https://t.me/MA_Furniture_bot?text=${encodeURIComponent(message)}`;
            
            window.open(telegramUrl, '_blank', 'noopener,noreferrer');
            
            return { 
                success: true, 
                telegram_opened: true,
                message: 'Telegram открыт для отправки заказа' 
            };
        } catch (error) {
            console.error('DataManager: Ошибка при открытии Telegram:', error);
            return { 
                success: false, 
                error: 'Не удалось открыть Telegram' 
            };
        }
    }

    formatOrderMessage(orderData) {
        let message = '🛒 НОВЫЙ ЗАКАЗ MA FURNITURE\\n\\n';
        
        message += '📦 *Состав заказа:*\\n';
        orderData.items.forEach((item, index) => {
            message += `${index + 1}. ${item.name}\\n`;
            message += `   Количество: ${item.quantity} шт.\\n`;
            message += `   Цена за шт: ${this.formatPrice(item.price)}\\n`;
            message += `   Сумма: ${this.formatPrice(item.price * item.quantity)}\\n\\n`;
        });
        
        message += `💰 *ОБЩАЯ СУММА: ${this.formatPrice(orderData.total)}*\\n\\n`;
        
        message += '👤 *Данные клиента:*\\n';
        message += `ФИО: ${orderData.customer_name}\\n`;
        message += `Телефон: ${orderData.customer_phone}\\n`;
        
        if (orderData.customer_email) {
            message += `Email: ${orderData.customer_email}\\n`;
        }
        
        if (orderData.customer_address) {
            message += `Адрес: ${orderData.customer_address}\\n`;
        }
        
        if (orderData.customer_comment) {
            message += `Комментарий: ${orderData.customer_comment}\\n`;
        }
        
        message += `\\n📅 ${new Date().toLocaleString('ru-RU')}`;
        message += `\\n\\n🌐 *Заказ с сайта: MA Furniture*`;
        
        return message;
    }

    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0
        }).format(price);
    }

    async checkAPIHealth() {
        try {
            const response = await fetch('/api/health');
            if (response.ok) {
                const data = await response.json();
                return {
                    available: true,
                    status: data.status,
                    telegram: data.telegram
                };
            }
        } catch (error) {
            console.log('DataManager: API для заказов недоступно');
        }
        return { available: false };
    }

    getStats() {
        const activeProducts = this.getActiveProducts();
        const totalProducts = activeProducts.length;
        const featuredProducts = activeProducts.filter(p => p.featured).length;
        const totalSections = this.getActiveSections().length;
        
        return {
            totalProducts,
            featuredProducts,
            totalSections,
            lastUpdated: new Date().toISOString()
        };
    }
}

const dataManager = new DataManager();