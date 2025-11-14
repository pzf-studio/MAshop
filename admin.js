// admin.js - Основная логика админ-панели MA Furniture
class AdminPanel {
    constructor() {
        // 🔐 Проверка авторизации
        if (!adminAuth.validateSession()) {
            window.location.href = 'admin-login.html';
            return;
        }

        this.products = [];
        this.sections = [];
        this.currentProductId = null;
        this.currentSectionId = null;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadData();
        this.renderProducts();
        this.renderSections();
        this.hideLoading();
        console.log('Admin panel initialized');
    }

    hideLoading() {
        const loadingElement = document.getElementById('pageLoading');
        if (loadingElement) {
            loadingElement.classList.add('hidden');
        }
    }

    // 🔐 Уведомления
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation' : 'info'}-circle"></i>
                ${message}
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Ограничение на количество изображений
    validateImageCount(currentImages, newImages, maxCount = 5) {
        const total = currentImages.length + newImages.length;
        if (total > maxCount) {
            this.showNotification(`Максимум ${maxCount} изображений`, 'error');
            return false;
        }
        return true;
    }

    setupEventListeners() {
        // Табы
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // Кнопка добавления товара
        document.getElementById('addProductBtn')?.addEventListener('click', () => {
            this.openProductModal();
        });

        // Кнопка добавления раздела
        document.getElementById('addSectionBtn')?.addEventListener('click', () => {
            this.openSectionModal();
        });

        // Кнопка обновления
        document.getElementById('refreshBtn')?.addEventListener('click', () => {
            this.loadData();
        });

        // Закрытие модальных окон
        document.getElementById('modalClose')?.addEventListener('click', () => {
            this.closeModal('productModal');
        });

        document.getElementById('cancelBtn')?.addEventListener('click', () => {
            this.closeModal('productModal');
        });

        document.getElementById('sectionModalClose')?.addEventListener('click', () => {
            this.closeModal('sectionModal');
        });

        document.getElementById('cancelSectionBtn')?.addEventListener('click', () => {
            this.closeModal('sectionModal');
        });

        // Форма товара
        document.getElementById('productForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProduct();
        });

        // Форма раздела
        document.getElementById('sectionForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSection();
        });

        // Выбор бейджа
        document.querySelectorAll('.badge-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.badge-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                document.getElementById('productBadge').value = option.dataset.badge;
            });
        });

        // Загрузка изображений
        document.getElementById('uploadImagesBtn')?.addEventListener('click', () => {
            document.getElementById('productImages').click();
        });

        document.getElementById('productImages')?.addEventListener('change', (e) => {
            this.handleImageUpload(e.target.files);
        });

        // Подтверждение удаления
        document.getElementById('confirmDelete')?.addEventListener('click', () => {
            this.confirmDeleteProduct();
        });

        document.getElementById('cancelDelete')?.addEventListener('click', () => {
            this.closeModal('confirmModal');
        });

        document.getElementById('confirmSectionDelete')?.addEventListener('click', () => {
            this.confirmDeleteSection();
        });

        document.getElementById('cancelSectionDelete')?.addEventListener('click', () => {
            this.closeModal('sectionConfirmModal');
        });

        // НОВАЯ СИСТЕМА: Обработчик для нескольких цветов
        document.getElementById('enableMultipleColors')?.addEventListener('change', (e) => {
            const colorsContainer = document.getElementById('colorsContainer');
            colorsContainer.style.display = e.target.checked ? 'block' : 'none';
            if (e.target.checked) {
                this.renderColorVariants();
            }
        });

        // НОВАЯ СИСТЕМА: Кнопка добавления цвета
        document.getElementById('addColorBtn')?.addEventListener('click', () => {
            this.addColorVariant();
        });
    }

    switchTab(tabName) {
        // Скрыть все табы
        document.querySelectorAll('.admin-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Показать выбранный таб
        document.getElementById(tabName + 'Tab')?.classList.add('active');
        
        // Обновить активную кнопку таба
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
    }

    async loadData() {
        try {
            // Загрузка из localStorage
            this.products = JSON.parse(localStorage.getItem('adminProducts')) || [];
            this.sections = JSON.parse(localStorage.getItem('adminSections')) || [];

            // Если разделов нет, создаем базовые
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

            this.renderProducts();
            this.renderSections();
            
            this.showNotification('Данные загружены', 'success');
            
        } catch (error) {
            console.error('Load data error:', error);
            this.showNotification('Ошибка загрузки данных', 'error');
        }
    }

    renderProducts() {
        const tbody = document.getElementById('productsTableBody');
        if (!tbody) return;

        // Обновляем счетчик товаров в разделах
        this.updateSectionCounts();

        // Показываем только основные товары (не варианты цветов)
        const mainProducts = this.products.filter(product => !product.isColorVariant);

        tbody.innerHTML = mainProducts.map(product => {
            const colorVariants = this.products.filter(p => 
                p.isColorVariant && p.originalProductId === product.id
            );
            
            const colorsInfo = product.multipleColors ? 
                `<small style="color: #666;">${colorVariants.length} цветов</small>` : 
                '';
            
            return `
                <tr>
                    <td>${product.id}</td>
                    <td>
                        <div class="product-with-image">
                            ${product.images && product.images.length > 0 ? 
                                `<img src="${product.images[0]}" alt="${product.name}" class="product-image-small">` : 
                                '<div class="product-image-small" style="background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #666;"><i class="fas fa-cube"></i></div>'
                            }
                            <div>
                                ${product.name}
                                ${colorsInfo}
                            </div>
                        </div>
                    </td>
                    <td>${this.getSectionName(product.section)}</td>
                    <td>${product.price.toLocaleString()} ₽</td>
                    <td>${product.badge || '-'}</td>
                    <td>${product.multipleColors ? `${colorVariants.length} вариантов` : '-'}</td>
                    <td>
                        <span class="status-badge ${product.active ? 'active' : 'inactive'}">
                            ${product.active ? 'Активен' : 'Неактивен'}
                        </span>
                    </td>
                    <td>
                        <div class="product-actions">
                            <button class="btn-edit" onclick="adminPanel.editProduct(${product.id})">
                                <i class="fas fa-edit"></i> Изменить
                            </button>
                            <button class="btn-delete" onclick="adminPanel.deleteProduct(${product.id})">
                                <i class="fas fa-trash"></i> Удалить
                            </button>
                            ${product.multipleColors ? `
                            <button class="btn-view" onclick="adminPanel.viewColorVariants(${product.id})">
                                <i class="fas fa-palette"></i> Цвета
                            </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Обновляем счетчик
        const counter = document.getElementById('productCounter');
        if (counter) {
            const activeCount = mainProducts.filter(p => p.active).length;
            counter.textContent = `Товаров: ${activeCount}/${mainProducts.length}`;
        }
    }

    renderSections() {
        const tbody = document.getElementById('sectionsTableBody');
        if (!tbody) return;

        tbody.innerHTML = this.sections.map(section => `
            <tr>
                <td>${section.id}</td>
                <td>${section.name}</td>
                <td>${section.code}</td>
                <td>${section.product_count}</td>
                <td>
                    <span class="status-badge ${section.active ? 'active' : 'inactive'}">
                        ${section.active ? 'Активен' : 'Неактивен'}
                    </span>
                </td>
                <td>
                    <div class="product-actions">
                        <button class="btn-edit" onclick="adminPanel.editSection(${section.id})">
                            <i class="fas fa-edit"></i> Изменить
                        </button>
                        <button class="btn-delete" onclick="adminPanel.deleteSection(${section.id})">
                            <i class="fas fa-trash"></i> Удалить
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Обновляем счетчик разделов
        const counter = document.getElementById('sectionsCounter');
        if (counter) {
            counter.textContent = `Разделов: ${this.sections.length}`;
        }
    }

    updateSectionCounts() {
        this.sections.forEach(section => {
            section.product_count = this.products.filter(product => 
                product.section === section.code && product.active && !product.isColorVariant
            ).length;
        });
        this.saveSections();
    }

    getSectionName(sectionCode) {
        const section = this.sections.find(s => s.code === sectionCode);
        return section ? section.name : sectionCode;
    }

    openProductModal(product = null) {
        this.currentProductId = product ? product.id : null;
        const modal = document.getElementById('productModal');
        const title = document.getElementById('modalTitle');
        
        if (product) {
            title.textContent = 'Редактировать товар';
            this.fillProductForm(product);
        } else {
            title.textContent = 'Добавить товар';
            this.resetProductForm();
        }
        
        this.renderSectionOptions();
        modal.classList.add('active');
    }

    openSectionModal(section = null) {
        this.currentSectionId = section ? section.id : null;
        const modal = document.getElementById('sectionModal');
        const title = document.getElementById('sectionModalTitle');
        
        if (section) {
            title.textContent = 'Редактировать раздел';
            this.fillSectionForm(section);
        } else {
            title.textContent = 'Добавить раздел';
            this.resetSectionForm();
        }
        
        modal.classList.add('active');
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
        this.currentProductId = null;
        this.currentSectionId = null;
    }

    resetProductForm() {
        document.getElementById('productForm').reset();
        document.getElementById('productId').value = '';
        document.getElementById('productBadge').value = '';
        document.querySelectorAll('.badge-option').forEach(opt => opt.classList.remove('selected'));
        document.querySelector('.badge-option[data-badge=""]').classList.add('selected');
        document.getElementById('imagePreview').innerHTML = '';
        document.getElementById('enableMultipleColors').checked = false;
        document.getElementById('colorsContainer').style.display = 'none';
        document.getElementById('colorsVariantsList').innerHTML = '';
    }

    resetSectionForm() {
        document.getElementById('sectionForm').reset();
        document.getElementById('sectionId').value = '';
    }

    fillProductForm(product) {
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productSection').value = product.section;
        document.getElementById('productSku').value = product.sku || '';
        document.getElementById('productStock').value = product.stock || 0;
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productFeatures').value = Array.isArray(product.features) ? 
            product.features.join('\n') : (product.features || '');
        document.getElementById('productSpecifications').value = typeof product.specifications === 'object' ? 
            Object.entries(product.specifications).map(([k, v]) => `${k}: ${v}`).join('\n') : 
            (product.specifications || '');
        document.getElementById('productActive').checked = product.active !== false;
        document.getElementById('productFeatured').checked = product.featured || false;
        
        // Бейдж
        document.getElementById('productBadge').value = product.badge || '';
        document.querySelectorAll('.badge-option').forEach(opt => opt.classList.remove('selected'));
        document.querySelector(`.badge-option[data-badge="${product.badge || ''}"]`).classList.add('selected');
        
        // НОВАЯ СИСТЕМА: Обработка нескольких цветов
        const isMultiColor = product.multipleColors || false;
        document.getElementById('enableMultipleColors').checked = isMultiColor;
        
        const colorsContainer = document.getElementById('colorsContainer');
        colorsContainer.style.display = isMultiColor ? 'block' : 'none';
        
        if (isMultiColor && product.colorVariants) {
            this.renderColorVariants(product.colorVariants);
        } else if (isMultiColor) {
            // Создаем цвета на основе старых данных
            const colorVariants = this.createColorVariantsFromLegacyData(product);
            this.renderColorVariants(colorVariants);
        }
        
        // Изображения
        this.renderImagePreview(product.images || []);
    }

    fillSectionForm(section) {
        document.getElementById('sectionId').value = section.id;
        document.getElementById('sectionName').value = section.name;
        document.getElementById('sectionCode').value = section.code;
        document.getElementById('sectionActive').checked = section.active !== false;
    }

    renderSectionOptions() {
        const select = document.getElementById('productSection');
        select.innerHTML = '<option value="">Выберите раздел</option>' +
            this.sections.filter(s => s.active).map(section => 
                `<option value="${section.code}">${section.name}</option>`
            ).join('');
    }

    renderImagePreview(images) {
        const container = document.getElementById('imagePreview');
        container.innerHTML = images.map((image, index) => `
            <div class="preview-item">
                <img src="${image}" alt="Preview ${index + 1}">
                <button type="button" class="remove-image" onclick="adminPanel.removeImage(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
        
        // Добавляем счетчик
        const counter = document.createElement('div');
        counter.className = 'image-counter';
        counter.textContent = `${images.length}/5 изображений`;
        container.appendChild(counter);
    }

    handleImageUpload(files) {
        const currentImages = this.getCurrentImages();
        
        // Проверяем лимит
        if (!this.validateImageCount(currentImages, Array.from(files))) {
            return;
        }
        
        const images = [];
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    images.push(e.target.result);
                    if (images.length === files.length) {
                        this.addImagesToPreview(images);
                    }
                };
                reader.readAsDataURL(file);
            }
        }
    }

    addImagesToPreview(newImages) {
        const container = document.getElementById('imagePreview');
        const currentImages = this.getCurrentImages();
        const allImages = [...currentImages, ...newImages];
        
        this.renderImagePreview(allImages);
    }

    removeImage(index) {
        const currentImages = this.getCurrentImages();
        currentImages.splice(index, 1);
        this.renderImagePreview(currentImages);
    }

    getCurrentImages() {
        const container = document.getElementById('imagePreview');
        const images = Array.from(container.querySelectorAll('img')).map(img => img.src);
        return images.filter(img => !img.includes('data:image/svg')); // Исключаем счетчик
    }

    // НОВАЯ СИСТЕМА: Рендер контейнера цветов
    renderColorVariants(colors = []) {
        const container = document.getElementById('colorsVariantsList');
        container.innerHTML = '';

        if (colors.length === 0) {
            // Создаем один цвет по умолчанию
            this.addColorVariant();
            return;
        }

        colors.forEach((color, index) => {
            const colorElement = this.createColorVariantElement(color, index);
            container.appendChild(colorElement);
        });
    }

    // НОВАЯ СИСТЕМА: Создание элемента цвета
    createColorVariantElement(colorData, index) {
        const colorDiv = document.createElement('div');
        colorDiv.className = 'color-variant-item';
        colorDiv.innerHTML = `
            <div class="color-variant-header">
                <h4>Цвет ${index + 1}</h4>
                <button type="button" class="btn-remove-color" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="color-variant-content">
                <div class="form-group">
                    <label>Название цвета</label>
                    <input type="text" class="color-name" value="${colorData.name || `Цвет ${index + 1}`}" 
                           placeholder="Например: Бежевый, Серебристый">
                </div>
                
                <div class="form-group">
                    <label>Выберите цвет</label>
                    <div class="color-palette-selector">
                        ${this.generateColorPalette(colorData.hex || '#cccccc')}
                    </div>
                    <input type="color" class="color-picker" value="${colorData.hex || '#cccccc'}" 
                           style="margin-top: 5px;">
                </div>
                
                <div class="form-group">
                    <label>Фотографии для этого цвета</label>
                    <div class="color-images-container">
                        <div class="color-images-preview" id="colorImagesPreview${index}">
                            ${this.renderColorImagesPreview(colorData.images || [])}
                        </div>
                        <input type="file" class="color-images-input" multiple accept="image/*" 
                               data-index="${index}" style="display: none;">
                        <button type="button" class="btn btn-outline upload-color-images" data-index="${index}">
                            <i class="fas fa-upload"></i> Загрузить фото (макс. 5)
                        </button>
                        <small>Можно загрузить до 5 изображений для этого цвета.</small>
                    </div>
                </div>
            </div>
        `;

        // Обработчики событий для этого цвета
        this.attachColorVariantEventListeners(colorDiv, index);
        return colorDiv;
    }

    // НОВАЯ СИСТЕМА: Генерация палитры цветов
    generateColorPalette(selectedColor) {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
            '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA',
            '#F1948A', '#85C1E9', '#D7BDE2', '#F9E79F', '#A9DFBF', '#F5B7B1',
            '#cccccc', '#666666', '#333333', '#000000', '#ffffff'
        ];

        return colors.map(color => `
            <div class="color-option ${color === selectedColor ? 'selected' : ''}" 
                 style="background-color: ${color}" 
                 data-color="${color}" 
                 title="${color}">
                ${color === selectedColor ? '<i class="fas fa-check"></i>' : ''}
            </div>
        `).join('');
    }

    // НОВАЯ СИСТЕМА: Рендер превью изображений для цвета
    renderColorImagesPreview(images) {
        if (!images || images.length === 0) {
            return '<div class="no-images">Нет загруженных изображений</div>';
        }

        return images.map((img, imgIndex) => `
            <div class="preview-item">
                <img src="${img}" alt="Preview ${imgIndex + 1}">
                <button type="button" class="remove-image" data-index="${imgIndex}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    // НОВАЯ СИСТЕМА: Добавление обработчиков для варианта цвета
    attachColorVariantEventListeners(colorElement, index) {
        // Выбор цвета из палитры
        colorElement.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', () => {
                const color = option.dataset.color;
                colorElement.querySelector('.color-picker').value = color;
                colorElement.querySelectorAll('.color-option').forEach(opt => 
                    opt.classList.remove('selected')
                );
                option.classList.add('selected');
                option.innerHTML = '<i class="fas fa-check"></i>';
            });
        });

        // Кастомный выбор цвета
        const colorPicker = colorElement.querySelector('.color-picker');
        colorPicker.addEventListener('change', (e) => {
            const newColor = e.target.value;
            colorElement.querySelectorAll('.color-option').forEach(opt => 
                opt.classList.remove('selected')
            );
            
            // Найти ближайший цвет в палитре или показать, что выбран кастомный
            const customOption = Array.from(colorElement.querySelectorAll('.color-option'))
                .find(opt => opt.dataset.color === newColor);
            
            if (customOption) {
                customOption.classList.add('selected');
                customOption.innerHTML = '<i class="fas fa-check"></i>';
            }
        });

        // Загрузка изображений для цвета
        const uploadBtn = colorElement.querySelector('.upload-color-images');
        const fileInput = colorElement.querySelector('.color-images-input');
        
        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            this.handleColorImageUpload(e.target.files, index);
        });

        // Удаление цвета
        const removeBtn = colorElement.querySelector('.btn-remove-color');
        removeBtn.addEventListener('click', () => {
            this.removeColorVariant(index);
        });

        // Удаление отдельных изображений
        colorElement.querySelectorAll('.remove-image').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const imgIndex = parseInt(e.target.closest('.remove-image').dataset.index);
                this.removeColorImage(index, imgIndex);
            });
        });
    }

    // НОВАЯ СИСТЕМА: Добавление нового цвета
    addColorVariant() {
        const container = document.getElementById('colorsVariantsList');
        const colorCount = container.children.length;
        
        if (colorCount >= 10) {
            this.showNotification('Максимум 10 цветов', 'error');
            return;
        }

        const newColor = {
            name: `Цвет ${colorCount + 1}`,
            hex: this.getRandomColor(),
            images: []
        };

        const colorElement = this.createColorVariantElement(newColor, colorCount);
        container.appendChild(colorElement);
    }

    // НОВАЯ СИСТЕМА: Удаление цвета
    removeColorVariant(index) {
        const container = document.getElementById('colorsVariantsList');
        const colorCount = container.children.length;
        
        if (colorCount <= 1) {
            this.showNotification('Должен остаться хотя бы один цвет', 'error');
            return;
        }

        container.children[index].remove();
        
        // Обновляем индексы оставшихся элементов
        Array.from(container.children).forEach((child, newIndex) => {
            const header = child.querySelector('h4');
            header.textContent = `Цвет ${newIndex + 1}`;
            
            const removeBtn = child.querySelector('.btn-remove-color');
            removeBtn.dataset.index = newIndex;
            
            const uploadBtn = child.querySelector('.upload-color-images');
            uploadBtn.dataset.index = newIndex;
            
            const fileInput = child.querySelector('.color-images-input');
            fileInput.dataset.index = newIndex;
        });
    }

    // НОВАЯ СИСТЕМА: Обработка загрузки изображений для цвета
    handleColorImageUpload(files, colorIndex) {
        const currentImages = this.getCurrentColorImages(colorIndex);
        
        // Проверяем лимит
        if (!this.validateImageCount(currentImages, Array.from(files))) {
            return;
        }
        
        const images = [];
        let loadedCount = 0;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    images.push(e.target.result);
                    loadedCount++;
                    
                    if (loadedCount === files.length) {
                        this.addImagesToColorPreview(images, colorIndex);
                    }
                };
                reader.readAsDataURL(file);
            }
        }
    }

    // НОВАЯ СИСТЕМА: Добавление изображений в превью цвета
    addImagesToColorPreview(newImages, colorIndex) {
        const previewContainer = document.getElementById(`colorImagesPreview${colorIndex}`);
        const currentImages = this.getCurrentColorImages(colorIndex);
        const allImages = [...currentImages, ...newImages];
        
        this.renderColorImagesToPreview(allImages, colorIndex);
    }

    // НОВАЯ СИСТЕМА: Получение текущих изображений цвета
    getCurrentColorImages(colorIndex) {
        const previewContainer = document.getElementById(`colorImagesPreview${colorIndex}`);
        if (!previewContainer) return [];
        
        const images = Array.from(previewContainer.querySelectorAll('img')).map(img => img.src);
        return images.filter(img => !img.includes('data:image/svg')); // Исключаем счетчик
    }

    // НОВАЯ СИСТЕМА: Рендер изображений в превью
    renderColorImagesToPreview(images, colorIndex) {
        const previewContainer = document.getElementById(`colorImagesPreview${colorIndex}`);
        
        if (!images || images.length === 0) {
            previewContainer.innerHTML = '<div class="no-images">Нет загруженных изображений</div>';
            return;
        }

        previewContainer.innerHTML = images.map((img, imgIndex) => `
            <div class="preview-item">
                <img src="${img}" alt="Preview ${imgIndex + 1}">
                <button type="button" class="remove-image" data-index="${imgIndex}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
        
        // Добавляем счетчик для цвета
        const counter = document.createElement('div');
        counter.className = 'image-counter';
        counter.textContent = `${images.length}/5 изображений`;
        previewContainer.appendChild(counter);

        // Прикрепляем обработчики для новых кнопок удаления
        previewContainer.querySelectorAll('.remove-image').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const imgIndex = parseInt(e.target.closest('.remove-image').dataset.index);
                this.removeColorImage(colorIndex, imgIndex);
            });
        });
    }

    // НОВАЯ СИСТЕМА: Удаление отдельного изображения цвета
    removeColorImage(colorIndex, imgIndex) {
        const currentImages = this.getCurrentColorImages(colorIndex);
        currentImages.splice(imgIndex, 1);
        this.renderColorImagesToPreview(currentImages, colorIndex);
    }

    // НОВАЯ СИСТЕМА: Получение случайного цвета
    getRandomColor() {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // НОВАЯ СИСТЕМА: Создание вариантов цветов из старых данных
    createColorVariantsFromLegacyData(product) {
        const variants = [];
        const colorCount = product.colorsCount || 1;
        
        // Получаем существующие варианты из базы
        const existingVariants = this.products.filter(p => 
            p.isColorVariant && p.originalProductId === product.id
        );
        
        for (let i = 1; i <= colorCount; i++) {
            const existingVariant = existingVariants.find(v => v.colorIndex === i);
            
            variants.push({
                name: existingVariant?.colorName || `Цвет ${i}`,
                hex: existingVariant?.colorHex || this.getRandomColor(),
                images: existingVariant?.images || []
            });
        }
        
        return variants;
    }

    // НОВАЯ СИСТЕМА: Получение данных о цветах из формы
    getColorVariantsData() {
        const colorVariants = [];
        const colorElements = document.querySelectorAll('.color-variant-item');
        
        colorElements.forEach((element, index) => {
            const name = element.querySelector('.color-name').value;
            const hex = element.querySelector('.color-picker').value;
            const images = this.getCurrentColorImages(index);
            
            colorVariants.push({
                name: name,
                hex: hex,
                images: images,
                index: index + 1
            });
        });
        
        return colorVariants;
    }

    saveProduct() {
        try {
            const formData = new FormData(document.getElementById('productForm'));
            const images = this.getCurrentImages();
            
            const enableMultipleColors = document.getElementById('enableMultipleColors').checked;
            const colorVariants = enableMultipleColors ? this.getColorVariantsData() : [];

            const productData = {
                id: this.currentProductId || this.generateProductId(),
                name: document.getElementById('productName').value,
                price: parseInt(document.getElementById('productPrice').value),
                section: document.getElementById('productSection').value,
                sku: document.getElementById('productSku').value,
                stock: parseInt(document.getElementById('productStock').value) || 0,
                description: document.getElementById('productDescription').value,
                features: this.parseFeatures(document.getElementById('productFeatures').value),
                specifications: this.parseSpecifications(document.getElementById('productSpecifications').value),
                badge: document.getElementById('productBadge').value,
                active: document.getElementById('productActive').checked,
                featured: document.getElementById('productFeatured').checked,
                images: images,
                multipleColors: enableMultipleColors,
                colorVariants: colorVariants, // НОВОЕ ПОЛЕ
                isColorVariant: false,
                originalProductId: null,
                updatedAt: new Date().toISOString()
            };

            if (!productData.name || !productData.price || !productData.section) {
                this.showNotification('Заполните все обязательные поля', 'error');
                return;
            }

            if (this.currentProductId) {
                // Редактирование
                const index = this.products.findIndex(p => p.id === this.currentProductId);
                if (index !== -1) {
                    // Если включены несколько цветов, обновляем варианты
                    if (enableMultipleColors) {
                        this.updateColorVariants(productData, colorVariants);
                    } else {
                        // Если отключили несколько цветов, удаляем варианты
                        this.removeColorVariants(productData.id);
                    }
                    
                    productData.createdAt = this.products[index].createdAt;
                    this.products[index] = productData;
                    this.showNotification('Товар обновлен', 'success');
                }
            } else {
                // Добавление
                productData.createdAt = new Date().toISOString();
                this.products.push(productData);
                
                // Если включены несколько цветов, создаем варианты
                if (enableMultipleColors) {
                    this.createColorVariants(productData, colorVariants);
                }
                
                this.showNotification('Товар добавлен', 'success');
            }

            this.saveProducts();
            this.renderProducts();
            this.closeModal('productModal');
            this.notifyProductsUpdate();

        } catch (error) {
            console.error('Save product error:', error);
            this.showNotification('Ошибка сохранения товара', 'error');
        }
    }

    createColorVariants(mainProduct, colorVariants) {
        colorVariants.forEach((colorVariant, index) => {
            const variant = {
                ...mainProduct,
                id: this.generateProductId(),
                name: `${mainProduct.name} - ${colorVariant.name}`,
                sku: `${mainProduct.sku || 'MF'}_${index + 1}`,
                isColorVariant: true,
                originalProductId: mainProduct.id,
                colorIndex: index + 1,
                colorName: colorVariant.name, // НОВОЕ ПОЛЕ
                colorHex: colorVariant.hex,   // НОВОЕ ПОЛЕ
                images: colorVariant.images,  // Индивидуальные изображения
                multipleColors: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            this.products.push(variant);
        });
    }

    updateColorVariants(mainProduct, newColorVariants) {
        // Удаляем старые варианты
        this.removeColorVariants(mainProduct.id);
        
        // Создаем новые варианты
        this.createColorVariants(mainProduct, newColorVariants);
    }

    removeColorVariants(productId) {
        this.products = this.products.filter(p => 
            !p.isColorVariant || p.originalProductId !== productId
        );
    }

    viewColorVariants(productId) {
        const variants = this.products.filter(p => 
            p.isColorVariant && p.originalProductId === productId
        );
        
        let message = `Варианты цветов для товара ID ${productId}:\n\n`;
        variants.forEach(variant => {
            message += `• ${variant.name} (Артикул: ${variant.sku})\n`;
        });
        
        alert(message);
    }

    saveSection() {
        try {
            const sectionData = {
                id: this.currentSectionId || this.generateSectionId(),
                name: document.getElementById('sectionName').value,
                code: document.getElementById('sectionCode').value,
                active: document.getElementById('sectionActive').checked,
                product_count: 0
            };

            if (!sectionData.name || !sectionData.code) {
                this.showNotification('Заполните все поля', 'error');
                return;
            }

            // Проверка уникальности кода
            const existingSection = this.sections.find(s => 
                s.code === sectionData.code && s.id !== this.currentSectionId
            );
            if (existingSection) {
                this.showNotification('Раздел с таким кодом уже существует', 'error');
                return;
            }

            if (this.currentSectionId) {
                // Редактирование
                const index = this.sections.findIndex(s => s.id === this.currentSectionId);
                if (index !== -1) {
                    this.sections[index] = { ...this.sections[index], ...sectionData };
                    this.showNotification('Раздел обновлен', 'success');
                }
            } else {
                // Добавление
                this.sections.push(sectionData);
                this.showNotification('Раздел добавлен', 'success');
            }

            this.saveSections();
            this.renderSections();
            this.closeModal('sectionModal');
            this.notifySectionsUpdate();

        } catch (error) {
            console.error('Save section error:', error);
            this.showNotification('Ошибка сохранения раздела', 'error');
        }
    }

    parseFeatures(featuresText) {
        return featuresText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
    }

    parseSpecifications(specsText) {
        const specifications = {};
        const lines = specsText.split('\n');
        
        lines.forEach(line => {
            const [key, ...valueParts] = line.split(':');
            if (key && valueParts.length > 0) {
                specifications[key.trim()] = valueParts.join(':').trim();
            }
        });
        
        return specifications;
    }

    generateProductId() {
        const maxId = this.products.reduce((max, product) => Math.max(max, product.id), 0);
        return maxId + 1;
    }

    generateSectionId() {
        const maxId = this.sections.reduce((max, section) => Math.max(max, section.id), 0);
        return maxId + 1;
    }

    editProduct(id) {
        const product = this.products.find(p => p.id === id);
        if (product) {
            this.openProductModal(product);
        }
    }

    editSection(id) {
        const section = this.sections.find(s => s.id === id);
        if (section) {
            this.openSectionModal(section);
        }
    }

    deleteProduct(id) {
        this.productToDelete = id;
        const product = this.products.find(p => p.id === id);
        document.getElementById('confirmModal').classList.add('active');
    }

    deleteSection(id) {
        this.sectionToDelete = id;
        const section = this.sections.find(s => s.id === id);
        const message = document.getElementById('sectionConfirmMessage');
        message.textContent = `Вы уверены, что хотите удалить раздел "${section.name}"?`;
        document.getElementById('sectionConfirmModal').classList.add('active');
    }

    confirmDeleteProduct() {
        if (this.productToDelete) {
            // Удаляем основной товар и все его варианты цветов
            this.removeColorVariants(this.productToDelete);
            this.products = this.products.filter(p => p.id !== this.productToDelete);
            
            this.saveProducts();
            this.renderProducts();
            this.showNotification('Товар удален', 'success');
            this.notifyProductsUpdate();
            this.productToDelete = null;
        }
        this.closeModal('confirmModal');
    }

    confirmDeleteSection() {
        if (this.sectionToDelete) {
            // Проверяем, есть ли товары в этом разделе
            const productsInSection = this.products.filter(p => {
                const section = this.sections.find(s => s.id === this.sectionToDelete);
                return section && p.section === section.code;
            });

            if (productsInSection.length > 0) {
                this.showNotification('Нельзя удалить раздел, в котором есть товары', 'error');
                this.closeModal('sectionConfirmModal');
                return;
            }

            this.sections = this.sections.filter(s => s.id !== this.sectionToDelete);
            this.saveSections();
            this.renderSections();
            this.notifySectionsUpdate();
            this.showNotification('Раздел удален', 'success');
            this.sectionToDelete = null;
        }
        this.closeModal('sectionConfirmModal');
    }

    viewProduct(id) {
        window.open(`piece.html?id=${id}`, '_blank');
    }

    saveProducts() {
        localStorage.setItem('adminProducts', JSON.stringify(this.products));
        console.log('Admin: Сохранено товаров:', this.products.length);
        if (this.products.length > 0) {
            console.log('Admin: Пример товара:', this.products[0]);
        }
        this.notifyProductsUpdate();
    }

    saveSections() {
        try {
            localStorage.setItem('adminSections', JSON.stringify(this.sections));
            console.log('Admin: Разделы сохранены в localStorage');
        } catch (error) {
            console.error('Admin: Ошибка сохранения разделов:', error);
        }
    }

    // 🔐 Уведомление об обновлении товаров (для синхронизации с магазином)
    notifyProductsUpdate() {
        // Отправляем кастомное событие
        const event = new CustomEvent('adminProductsUpdated');
        window.dispatchEvent(event);
        
        // Также обновляем localStorage для cross-tab синхронизации
        localStorage.setItem('adminProducts', JSON.stringify(this.products));
        
        console.log('Admin: Уведомление об обновлении товаров отправлено');
        this.showNotification('Изменения синхронизированы с магазином', 'success');
    }

    // 🔐 Уведомление об обновлении разделов
    notifySectionsUpdate() {
        // Отправляем кастомное событие
        const event = new CustomEvent('adminSectionsUpdated');
        window.dispatchEvent(event);
        
        // Также обновляем localStorage для cross-tab синхронизации
        localStorage.setItem('adminSections', JSON.stringify(this.sections));
        
        console.log('Admin: Уведомление об обновлении разделов отправлено');
        this.showNotification('Разделы синхронизированы с магазином', 'success');
    }
}

// Инициализация
let adminPanel;
document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
});

// Глобальные функции для HTML
window.adminPanel = adminPanel;