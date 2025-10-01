class DataSync {
    static syncProducts() {
        try {
            const adminProducts = JSON.parse(localStorage.getItem('adminProducts')) || [];
            const shopProducts = adminProducts.map(product => ({
                id: product.id,
                name: product.name,
                price: product.price,
                category: product.category,
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
            
            // Триггерим событие для мгновенного обновления
            window.dispatchEvent(new Event('storage'));
            
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
}