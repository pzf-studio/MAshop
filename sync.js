// sync.js - Улучшенная синхронизация данных
class DataSync {
    static syncProducts() {
        try {
            const adminProducts = JSON.parse(localStorage.getItem('adminProducts')) || [];
            const shopProducts = adminProducts.map(product => ({
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
            
            localStorage.setItem('products', JSON.stringify(shopProducts));
            
            // Триггерим кастомное событие для мгновенного обновления
            window.dispatchEvent(new CustomEvent('productsUpdated', {
                detail: { products: shopProducts }
            }));
            
            // Также триггерим storage event для других вкладок
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'products',
                newValue: JSON.stringify(shopProducts)
            }));
            
            console.log('Синхронизация завершена:', shopProducts.length, 'товаров');
            return true;
        } catch (error) {
            console.error('Sync error:', error);
            return false;
        }
    }
    
    static getProductsForShop() {
        let products = JSON.parse(localStorage.getItem('products')) || [];
        
        if (products.length === 0) {
            this.syncProducts();
            products = JSON.parse(localStorage.getItem('products')) || [];
        }
        
        return products.filter(product => product.active === true);
    }
    
    // Мгновенная синхронизация при изменении
    static instantSync() {
        return this.syncProducts();
    }

    // Синхронизация разделов
    static syncSections() {
        try {
            const adminSections = JSON.parse(localStorage.getItem('adminSections')) || [];
            const activeSections = adminSections.filter(section => section.active);
            
            localStorage.setItem('sections', JSON.stringify(activeSections));
            
            window.dispatchEvent(new CustomEvent('sectionsUpdated', {
                detail: { sections: activeSections }
            }));
            
            console.log('Синхронизация разделов завершена:', activeSections.length, 'разделов');
            return true;
        } catch (error) {
            console.error('Sections sync error:', error);
            return false;
        }
    }

    // Проверка синхронизации
    static checkSyncStatus() {
        const adminProducts = JSON.parse(localStorage.getItem('adminProducts')) || [];
        const shopProducts = JSON.parse(localStorage.getItem('products')) || [];
        
        console.log('Статус синхронизации:', {
            adminProducts: adminProducts.length,
            shopProducts: shopProducts.length,
            synchronized: adminProducts.length === shopProducts.length
        });
        
        return adminProducts.length === shopProducts.length;
    }
}

// Автоматическая синхронизация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем и синхронизируем при необходимости
    if (!DataSync.checkSyncStatus()) {
        DataSync.syncProducts();
        DataSync.syncSections();
    }
});

// Экспортируем для глобального использования
window.DataSync = DataSync;