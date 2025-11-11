class DataSync {
    constructor() {
        this.storageKey = 'products';
        this.adminStorageKey = 'adminProducts';
        this.init();
    }

    init() {
        this.setupStorageListener();
        this.syncProducts();
    }

    syncProducts() {
        try {
            const adminProducts = JSON.parse(localStorage.getItem(this.adminStorageKey)) || [];
            
            if (adminProducts.length > 0) {
                const shopProducts = adminProducts.map(product => ({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    category: product.category,
                    section: product.section || 'all',
                    description: product.description,
                    badge: product.badge,
                    active: product.active !== false,
                    featured: product.featured || false,
                    stock: product.stock || 0,
                    sku: product.sku,
                    images: product.images || [],
                    features: this.parseFeatures(product.features),
                    specifications: this.parseSpecifications(product.specifications),
                    createdAt: product.createdAt || new Date().toISOString(),
                    updatedAt: product.updatedAt || new Date().toISOString()
                }));

                localStorage.setItem(this.storageKey, JSON.stringify(shopProducts));
                console.log(`Синхронизировано ${shopProducts.length} товаров из админ-панели`);
                
                this.dispatchUpdateEvent();
            }
        } catch (error) {
            console.error('Ошибка синхронизации:', error);
        }
    }

    parseFeatures(featuresInput) {
        if (!featuresInput) return [];
        if (Array.isArray(featuresInput)) return featuresInput;
        
        return featuresInput
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
    }

    parseSpecifications(specsInput) {
        if (!specsInput) return {};
        if (typeof specsInput === 'object') return specsInput;
        
        const specifications = {};
        const lines = specsInput.split('\n');
        
        lines.forEach(line => {
            const [key, ...valueParts] = line.split(':');
            if (key && valueParts.length > 0) {
                specifications[key.trim()] = valueParts.join(':').trim();
            }
        });
        
        return specifications;
    }

    setupStorageListener() {
        window.addEventListener('storage', (e) => {
            if (e.key === this.adminStorageKey) {
                console.log('Обнаружены изменения в админ-панели');
                this.syncProducts();
            }
        });

        window.addEventListener('adminProductsUpdated', () => {
            this.syncProducts();
        });
    }

    dispatchUpdateEvent() {
        const event = new CustomEvent('productsUpdated');
        window.dispatchEvent(event);
    }

    getProducts() {
        return JSON.parse(localStorage.getItem(this.storageKey)) || [];
    }

    getActiveProducts() {
        const products = this.getProducts();
        return products.filter(product => product.active);
    }

    getProductById(id) {
        const products = this.getProducts();
        return products.find(product => product.id === id);
    }
}

const dataSync = new DataSync();

function forceSync() {
    dataSync.syncProducts();
    return dataSync.getProducts().length;
}