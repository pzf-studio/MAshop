// admin.js
class AdminPanel {
    constructor() {
        this.products = JSON.parse(localStorage.getItem('adminProducts')) || [];
        this.sections = JSON.parse(localStorage.getItem('adminSections')) || this.getDefaultSections();
        this.currentProductId = null;
        this.currentSectionId = null;
        this.currentPage = 1;
        this.productsPerPage = 10;
        this.filteredProducts = [];
        
        this.init();
        this.setupRealTimeSync();
    }

    init() {
        this.setupEventListeners();
        this.loadProducts();
        this.loadSections();
        this.renderProductsTable();
        this.renderSectionsTable();
        this.updateProductCounter();
        this.updateSectionsCounter();
        this.populateSectionSelect();
        this.syncWithShop(); // Синхронизируем при инициализации
    }

    getDefaultSections() {
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

    setupEventListeners() {
        // Tabs
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Product actions
        document.getElementById('addProductBtn').addEventListener('click', () => this.openProductModal());
        document.getElementById('refreshBtn').addEventListener('click', () => this.refreshData());
        document.getElementById('productForm').addEventListener('submit', (e) => this.saveProduct(e));
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeProductModal());
        document.getElementById('modalClose').addEventListener('click', () => this.closeProductModal());

        // Section actions
        document.getElementById('addSectionBtn').addEventListener('click', () => this.openSectionModal());
        document.getElementById('sectionForm').addEventListener('submit', (e) => this.saveSection(e));
        document.getElementById('cancelSectionBtn').addEventListener('click', () => this.closeSectionModal());
        document.getElementById('sectionModalClose').addEventListener('click', () => this.closeSectionModal());

        // Badge selector
        document.querySelectorAll('.badge-option').forEach(option => {
            option.addEventListener('click', (e) => this.selectBadge(e.currentTarget));
        });

        // Confirmation modals
        document.getElementById('cancelDelete').addEventListener('click', () => this.closeConfirmModal());
        document.getElementById('confirmDelete').addEventListener('click', () => this.confirmDelete());
        
        document.getElementById('cancelSectionDelete').addEventListener('click', () => this.closeSectionConfirmModal());
        document.getElementById('confirmSectionDelete').addEventListener('click', () => this.confirmSectionDelete());

        // Image upload
        document.getElementById('uploadImagesBtn').addEventListener('click', () => {
            document.getElementById('productImages').click();
        });
        document.getElementById('productImages').addEventListener('change', (e) => {
            this.handleImageFiles(e.target.files);
        });
    }

    // Добавляем слушатель изменений в localStorage
    setupRealTimeSync() {
        window.addEventListener('storage', (e) => {
            if (e.key === 'adminProducts' && e.newValue) {
                try {
                    const newProducts = JSON.parse(e.newValue);
                    if (JSON.stringify(this.products) !== JSON.stringify(newProducts)) {
                        this.products = newProducts;
                        this.filteredProducts = [...this.products];
                        this.renderProductsTable();
                        this.updateProductCounter();
                        console.log('Данные синхронизированы в реальном времени');
                    }
                } catch (error) {
                    console.error('Ошибка синхронизации:', error);
                }
            }
        });
    }

    switchTab(tabName) {
        // Update active tab
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update active content
        document.querySelectorAll('.admin-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');

        // Update counters when switching to sections tab
        if (tabName === 'sections') {
            this.updateSectionProductCounts();
            this.renderSectionsTable();
        }
    }

    loadProducts() {
        // Load products from localStorage or initialize with empty array
        if (this.products.length === 0) {
            this.products = []; // Пустой массив вместо генерации образцов
            this.saveProducts();
        }
        this.filteredProducts = [...this.products];
    }

    loadSections() {
        // Load sections from localStorage or initialize with default sections
        if (this.sections.length === 0) {
            this.sections = this.getDefaultSections();
            this.saveSections();
        }
    }

    populateSectionSelect() {
        const select = document.getElementById('productSection');
        select.innerHTML = '<option value="">Выберите раздел</option>';
        
        this.sections
            .filter(section => section.active)
            .forEach(section => {
                const option = document.createElement('option');
                option.value = section.code;
                option.textContent = section.name;
                select.appendChild(option);
            });
    }

    renderProductsTable() {
        const tbody = document.getElementById('productsTableBody');
        
        if (this.filteredProducts.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state">
                        <p>Товары не найдены</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.filteredProducts.map(product => {
            const section = this.sections.find(s => s.code === product.section) || { name: 'Не указан' };
            return `
            <tr data-product-id="${product.id}">
                <td>${product.id}</td>
                <td>
                    <div class="product-with-image">
                        ${product.images && product.images.length > 0 ? 
                            `<img src="${product.images[0]}" alt="${product.name}" class="product-image-small">` : 
                            '<div class="product-image-small" style="background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #999;"><i class="fas fa-image"></i></div>'
                        }
                        <div>
                            <strong>${product.name}</strong><br>
                            <small>${product.sku}</small>
                        </div>
                    </div>
                </td>
                <td>${product.category}</td>
                <td>${section.name}</td>
                <td>₽ ${product.price.toLocaleString()}</td>
                <td>
                    ${product.badge ? `<span class="status-badge" style="background: #3498db;">${product.badge}</span>` : '-'}
                </td>
                <td>
                    <span class="status-badge ${product.active ? 'active' : 'inactive'}">
                        ${product.active ? 'Активен' : 'Неактивен'}
                    </span>
                </td>
                <td>
                    <div class="product-actions">
                        <button class="btn-edit" onclick="admin.editProduct(${product.id})">
                            <i class="fas fa-edit"></i> Изменить
                        </button>
                        <button class="btn-toggle-active" onclick="admin.toggleProductActive(${product.id})">
                            <i class="fas ${product.active ? 'fa-eye-slash' : 'fa-eye'}"></i>
                            ${product.active ? 'Скрыть' : 'Показать'}
                        </button>
                        <button class="btn-delete" onclick="admin.deleteProduct(${product.id})">
                            <i class="fas fa-trash"></i> Удалить
                        </button>
                    </div>
                </td>
            </tr>
        `}).join('');
    }

    renderSectionsTable() {
        const tbody = document.getElementById('sectionsTableBody');
        this.updateSectionProductCounts();
        
        if (this.sections.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <p>Разделы не найдены</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.sections.map(section => `
            <tr data-section-id="${section.id}">
                <td>${section.id}</td>
                <td>${section.name}</td>
                <td>${section.code}</td>
                <td style="text-align: center;">${section.productCount}</td>
                <td>
                    <span class="status-badge ${section.active ? 'active' : 'inactive'}">
                        ${section.active ? 'Активен' : 'Неактивен'}
                    </span>
                </td>
                <td>
                    <div class="product-actions">
                        <button class="btn-edit" onclick="admin.editSection(${section.id})">
                            <i class="fas fa-edit"></i> Изменить
                        </button>
                        <button class="btn-toggle-active" onclick="admin.toggleSectionActive(${section.id})">
                            <i class="fas ${section.active ? 'fa-eye-slash' : 'fa-eye'}"></i>
                            ${section.active ? 'Скрыть' : 'Показать'}
                        </button>
                        <button class="btn-delete" onclick="admin.deleteSection(${section.id})">
                            <i class="fas fa-trash"></i> Удалить
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    updateSectionProductCounts() {
        this.sections.forEach(section => {
            section.productCount = this.products.filter(product => 
                product.section === section.code && product.active
            ).length;
        });
    }

    openProductModal(productId = null) {
        // Проверяем лимит при добавлении нового товара
        if (!productId && this.products.length >= 35) {
            this.showNotification('Достигнуто максимальное количество товаров (35)', 'error');
            return;
        }

        this.currentProductId = productId;
        const modal = document.getElementById('productModal');
        const title = document.getElementById('modalTitle');
        
        if (productId) {
            // Edit mode
            title.textContent = 'Редактировать товар';
            const product = this.products.find(p => p.id === productId);
            this.populateProductForm(product);
        } else {
            // Add mode
            title.textContent = 'Добавить товар';
            this.resetProductForm();
        }
        
        modal.classList.add('active');
    }

    resetProductForm() {
        document.getElementById('productForm').reset();
        document.getElementById('productId').value = '';
        document.getElementById('imagePreview').innerHTML = '';
        document.getElementById('productBadge').value = '';
        document.getElementById('productFeatures').value = '';
        document.getElementById('productSpecifications').value = '';
        document.querySelectorAll('.badge-option').forEach(opt => opt.classList.remove('selected'));
        document.querySelector('.badge-option[data-badge=""]').classList.add('selected');
        document.getElementById('productSku').value = this.generateSKU();
        document.getElementById('productSection').value = '';
    }

    populateProductForm(product) {
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productSection').value = product.section || 'all';
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productSku').value = product.sku;
        document.getElementById('productStock').value = product.stock || 0;
        document.getElementById('productActive').checked = product.active;
        document.getElementById('productFeatured').checked = product.featured || false;
        document.getElementById('productFeatures').value = product.features ? product.features.join('\n') : '';
        document.getElementById('productSpecifications').value = product.specifications ? 
            Object.entries(product.specifications).map(([key, value]) => `${key}: ${value}`).join('\n') : '';
        
        // Set badge
        document.getElementById('productBadge').value = product.badge || '';
        document.querySelectorAll('.badge-option').forEach(opt => opt.classList.remove('selected'));
        const badgeOption = document.querySelector(`.badge-option[data-badge="${product.badge || ''}"]`);
        if (badgeOption) {
            badgeOption.classList.add('selected');
        }
        
        // Clear and repopulate images
        const preview = document.getElementById('imagePreview');
        preview.innerHTML = '';
        if (product.images && product.images.length > 0) {
            product.images.forEach(image => {
                this.addImageToPreview(image);
            });
        }
    }

    addImageToPreview(imageSrc) {
        const preview = document.getElementById('imagePreview');
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        previewItem.innerHTML = `
            <img src="${imageSrc}" alt="Preview">
            <button type="button" class="remove-image">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        previewItem.querySelector('.remove-image').addEventListener('click', () => {
            previewItem.remove();
        });
        
        preview.appendChild(previewItem);
    }

    handleImageFiles(files) {
        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                this.addImageToPreview(e.target.result);
            };
            reader.readAsDataURL(file);
        });
    }

    generateSKU() {
        const lastId = this.products.length > 0 ? Math.max(...this.products.map(p => p.id)) : 0;
        return `MAF-${String(lastId + 1).padStart(3, '0')}`;
    }

    closeProductModal() {
        document.getElementById('productModal').classList.remove('active');
    }

    saveProduct(e) {
        e.preventDefault();
        
        const productId = document.getElementById('productId').value;
        const images = this.getProductImages();
        
        // Проверяем ограничение в 35 товаров
        if (!productId && this.products.length >= 35) {
            this.showNotification('Достигнуто максимальное количество товаров (35)', 'error');
            return;
        }
        
        // Parse features and specifications
        const features = document.getElementById('productFeatures').value
            .split('\n')
            .filter(f => f.trim() !== '')
            .map(f => f.trim());
            
        const specifications = {};
        document.getElementById('productSpecifications').value
            .split('\n')
            .filter(s => s.trim() !== '')
            .forEach(spec => {
                const [key, ...valueParts] = spec.split(':');
                if (key && valueParts.length > 0) {
                    specifications[key.trim()] = valueParts.join(':').trim();
                }
            });

        const productData = {
            name: document.getElementById('productName').value,
            price: parseInt(document.getElementById('productPrice').value),
            category: document.getElementById('productCategory').value,
            section: document.getElementById('productSection').value || 'all',
            description: document.getElementById('productDescription').value,
            badge: document.getElementById('productBadge').value,
            sku: document.getElementById('productSku').value || this.generateSKU(),
            stock: parseInt(document.getElementById('productStock').value) || 0,
            active: document.getElementById('productActive').checked,
            featured: document.getElementById('productFeatured').checked,
            images: images,
            features: features,
            specifications: specifications,
            updatedAt: new Date().toISOString()
        };

        let notificationMessage = '';

        if (productId) {
            // Update existing product
            const index = this.products.findIndex(p => p.id === parseInt(productId));
            this.products[index] = { 
                ...this.products[index], 
                ...productData
            };
            notificationMessage = 'Товар успешно обновлен';
        } else {
            // Add new product
            if (this.products.length >= 35) {
                this.showNotification('Достигнуто максимальное количество товаров (35)', 'error');
                return;
            }
            
            const newProduct = {
                id: this.products.length > 0 ? Math.max(...this.products.map(p => p.id)) + 1 : 1,
                createdAt: new Date().toISOString(),
                ...productData
            };
            this.products.push(newProduct);
            notificationMessage = 'Товар успешно добавлен';
        }

        // Сохраняем и мгновенно обновляем
        this.saveProducts();
        this.closeProductModal();
        this.showNotification(notificationMessage, 'success');
    }

    getProductImages() {
        const previewItems = document.querySelectorAll('#imagePreview .preview-item img');
        return Array.from(previewItems).map(img => img.src);
    }

    editProduct(productId) {
        this.openProductModal(productId);
    }

    toggleProductActive(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            product.active = !product.active;
            product.updatedAt = new Date().toISOString();
            
            this.saveProducts(); // Сохраняем и мгновенно обновляем
            
            this.showNotification(
                `Товар "${product.name}" ${product.active ? 'активирован' : 'деактивирован'}`,
                'success'
            );
        }
    }

    deleteProduct(productId) {
        this.currentProductId = productId;
        document.getElementById('confirmModal').classList.add('active');
    }

    confirmDelete() {
        this.products = this.products.filter(p => p.id !== this.currentProductId);
        this.saveProducts(); // Сохраняем и мгновенно обновляем
        this.closeConfirmModal();
        this.showNotification('Товар успешно удален', 'success');
    }

    closeConfirmModal() {
        document.getElementById('confirmModal').classList.remove('active');
        this.currentProductId = null;
    }

    // Section Methods
    openSectionModal(sectionId = null) {
        this.currentSectionId = sectionId;
        const modal = document.getElementById('sectionModal');
        const title = document.getElementById('sectionModalTitle');
        
        if (sectionId) {
            // Edit mode
            title.textContent = 'Редактировать раздел';
            const section = this.sections.find(s => s.id === sectionId);
            this.populateSectionForm(section);
        } else {
            // Add mode
            title.textContent = 'Добавить раздел';
            this.resetSectionForm();
        }
        
        modal.classList.add('active');
    }

    resetSectionForm() {
        document.getElementById('sectionForm').reset();
        document.getElementById('sectionId').value = '';
        document.getElementById('sectionCode').value = '';
    }

    populateSectionForm(section) {
        document.getElementById('sectionId').value = section.id;
        document.getElementById('sectionName').value = section.name;
        document.getElementById('sectionCode').value = section.code;
        document.getElementById('sectionActive').checked = section.active;
    }

    closeSectionModal() {
        document.getElementById('sectionModal').classList.remove('active');
    }

    saveSection(e) {
        e.preventDefault();
        
        const sectionId = document.getElementById('sectionId').value;
        const sectionCode = document.getElementById('sectionCode').value.toLowerCase();
        
        // Check if code is unique
        const existingSection = this.sections.find(s => 
            s.code === sectionCode && s.id !== parseInt(sectionId)
        );
        
        if (existingSection) {
            this.showNotification('Раздел с таким кодом уже существует', 'error');
            return;
        }

        const sectionData = {
            name: document.getElementById('sectionName').value,
            code: sectionCode,
            active: document.getElementById('sectionActive').checked
        };

        let notificationMessage = '';

        if (sectionId) {
            // Update existing section
            const index = this.sections.findIndex(s => s.id === parseInt(sectionId));
            this.sections[index] = { 
                ...this.sections[index], 
                ...sectionData
            };
            notificationMessage = 'Раздел успешно обновлен';
        } else {
            // Add new section
            const newSection = {
                id: this.sections.length > 0 ? Math.max(...this.sections.map(s => s.id)) + 1 : 1,
                productCount: 0,
                ...sectionData
            };
            this.sections.push(newSection);
            notificationMessage = 'Раздел успешно добавлен';
        }

        this.saveSections();
        this.closeSectionModal();
        this.showNotification(notificationMessage, 'success');
    }

    editSection(sectionId) {
        this.openSectionModal(sectionId);
    }

    toggleSectionActive(sectionId) {
        const section = this.sections.find(s => s.id === sectionId);
        if (section) {
            section.active = !section.active;
            this.saveSections();
            
            this.showNotification(
                `Раздел "${section.name}" ${section.active ? 'активирован' : 'деактивирован'}`,
                'success'
            );
        }
    }

    deleteSection(sectionId) {
        const section = this.sections.find(s => s.id === sectionId);
        if (!section) return;

        // Check if section has products
        const productsInSection = this.products.filter(p => p.section === section.code && p.active);
        
        if (productsInSection.length > 0) {
            document.getElementById('sectionConfirmMessage').textContent = 
                `Раздел "${section.name}" содержит ${productsInSection.length} товаров. Удаление невозможно. Сначала переместите товары в другие разделы.`;
            document.getElementById('confirmSectionDelete').style.display = 'none';
        } else {
            document.getElementById('sectionConfirmMessage').textContent = 
                `Вы уверены, что хотите удалить раздел "${section.name}"?`;
            document.getElementById('confirmSectionDelete').style.display = 'block';
        }

        this.currentSectionId = sectionId;
        document.getElementById('sectionConfirmModal').classList.add('active');
    }

    confirmSectionDelete() {
        this.sections = this.sections.filter(s => s.id !== this.currentSectionId);
        this.saveSections();
        this.closeSectionConfirmModal();
        this.showNotification('Раздел успешно удален', 'success');
    }

    closeSectionConfirmModal() {
        document.getElementById('sectionConfirmModal').classList.remove('active');
        this.currentSectionId = null;
        document.getElementById('confirmSectionDelete').style.display = 'block';
    }

    selectBadge(element) {
        document.querySelectorAll('.badge-option').forEach(opt => opt.classList.remove('selected'));
        element.classList.add('selected');
        document.getElementById('productBadge').value = element.dataset.badge;
    }

    refreshData() {
        this.loadProducts();
        this.loadSections();
        this.renderProductsTable();
        this.renderSectionsTable();
        this.updateProductCounter();
        this.updateSectionsCounter();
        this.populateSectionSelect();
        this.syncWithShop(); // Синхронизируем при обновлении
        this.showNotification('Данные обновлены', 'success');
    }

    updateProductCounter() {
        const counter = document.getElementById('productCounter');
        if (counter) {
            counter.textContent = `Товаров: ${this.products.length}/35`;
            
            // Блокируем кнопку добавления при достижении лимита
            const addBtn = document.getElementById('addProductBtn');
            if (addBtn) {
                if (this.products.length >= 35) {
                    addBtn.disabled = true;
                    addBtn.style.opacity = '0.6';
                    addBtn.style.cursor = 'not-allowed';
                } else {
                    addBtn.disabled = false;
                    addBtn.style.opacity = '1';
                    addBtn.style.cursor = 'pointer';
                }
            }
        }
    }

    updateSectionsCounter() {
        const counter = document.getElementById('sectionsCounter');
        if (counter) {
            counter.textContent = `Разделов: ${this.sections.length}`;
        }
    }

    showNotification(message, type = 'info') {
        // Create notification container if it doesn't exist
        let container = document.getElementById('notificationContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationContainer';
            container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000;';
            document.body.appendChild(container);
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                ${message}
            </div>
        `;
        
        container.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Улучшенное сохранение с мгновенным обновлением
    saveProducts() {
        localStorage.setItem('adminProducts', JSON.stringify(this.products));
        
        console.log('Товары сохранены в админке:', this.products.length);
        console.log('Активные товары:', this.products.filter(p => p.active).length);
        
        // Мгновенное обновление интерфейса
        this.renderProductsTable();
        this.updateProductCounter();
        
        // Синхронизация с магазином без задержки
        this.syncWithShop();
        
        // Принудительное событие storage для других вкладок
        this.triggerStorageEvent();
        
        // Дополнительно отправляем кастомное событие для главной страницы
        window.dispatchEvent(new CustomEvent('adminProductsUpdated', {
            detail: { 
                totalProducts: this.products.length,
                activeProducts: this.products.filter(p => p.active).length
            }
        }));
        
        // НОВОЕ: Специальное событие для главной страницы
        window.dispatchEvent(new CustomEvent('productsDataChanged', {
            detail: { 
                source: 'admin',
                products: this.products.filter(p => p.active)
            }
        }));
    }

    saveSections() {
        localStorage.setItem('adminSections', JSON.stringify(this.sections));
        this.renderSectionsTable();
        this.updateSectionsCounter();
        this.populateSectionSelect();
        this.syncSectionsWithShop();
        this.triggerStorageEvent('adminSections');
    }

    triggerStorageEvent(key = 'adminProducts') {
        try {
            const event = new StorageEvent('storage', {
                key: key,
                newValue: localStorage.getItem(key),
                oldValue: localStorage.getItem(key),
                url: window.location.href,
                storageArea: localStorage
            });
            window.dispatchEvent(event);
        } catch (e) {
            // Fallback для браузеров, которые не поддерживают создание StorageEvent
            console.log('Storage event triggered');
        }
    }

    // НОВАЯ УЛУЧШЕННАЯ СИНХРОНИЗАЦИЯ
    syncWithShop() {
        const shopProducts = this.products.map(product => ({
            id: product.id,
            name: product.name,
            price: product.price,
            category: this.mapCategoryToShop(product.category),
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

        try {
            localStorage.setItem('products', JSON.stringify(shopProducts));
            console.log('Товары синхронизированы с магазином:', shopProducts.length);
            
            // Создаем кастомное событие для мгновенного обновления
            const event = new CustomEvent('productsUpdated', {
                detail: { products: shopProducts }
            });
            window.dispatchEvent(event);
            
            // Также триггерим storage event для других вкладок
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'products',
                newValue: JSON.stringify(shopProducts)
            }));
            
            // НОВОЕ: Специальное событие для главной страницы
            window.dispatchEvent(new CustomEvent('indexProductsUpdate', {
                detail: { 
                    products: shopProducts.filter(p => p.active),
                    timestamp: new Date().toISOString()
                }
            }));
            
            return true;
        } catch (error) {
            console.error('Ошибка синхронизации с магазином:', error);
            return false;
        }
    }

    syncSectionsWithShop() {
        const activeSections = this.sections.filter(section => section.active);
        try {
            localStorage.setItem('sections', JSON.stringify(activeSections));
            console.log('Разделы синхронизированы с магазином:', activeSections.length);
            
            window.dispatchEvent(new CustomEvent('sectionsUpdated', {
                detail: { sections: activeSections }
            }));
            
            return true;
        } catch (error) {
            console.error('Ошибка синхронизации разделов с магазином:', error);
            return false;
        }
    }

    mapCategoryToShop(adminCategory) {
        const categoryMap = {
            'pantograph': 'pantograph',
            'wardrobe': 'wardrobe',
            'premium': 'premium'
        };
        return categoryMap[adminCategory] || 'premium';
    }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.admin = new AdminPanel();
});