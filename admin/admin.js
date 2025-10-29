// admin.js - Основная логика админ-панели
class AdminPanel {
    constructor() {
        // 🔐 Проверка авторизации
        if (!adminAuth.validateSession()) {
            window.location.href = 'admin-login.html';
            return;
        }

        this.products = [];
        this.sections = [];
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadData();
        this.renderProducts();
        this.renderSections();
        this.hideLoading();
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
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
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
            // Имитация загрузки данных
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Тестовые данные
            this.products = [
                {
                    id: 1,
                    name: 'Тестовый товар 1',
                    category: 'pantograph',
                    section: 'classic',
                    price: 15000,
                    badge: 'Новинка',
                    active: true
                },
                {
                    id: 2,
                    name: 'Тестовый товар 2',
                    category: 'wardrobe',
                    section: 'modern',
                    price: 25000,
                    badge: 'Хит продаж',
                    active: true
                }
            ];

            this.sections = [
                { id: 1, name: 'Классические', code: 'classic', product_count: 5, active: true },
                { id: 2, name: 'Современные', code: 'modern', product_count: 3, active: true }
            ];

            this.renderProducts();
            this.renderSections();
            
            this.showNotification('Данные обновлены', 'success');
            
        } catch (error) {
            console.error('Load data error:', error);
            this.showNotification('Ошибка загрузки данных', 'error');
        }
    }

    renderProducts() {
        const tbody = document.getElementById('productsTableBody');
        if (!tbody) return;

        tbody.innerHTML = this.products.map(product => `
            <tr>
                <td>${product.id}</td>
                <td>
                    <div class="product-with-image">
                        <div>${product.name}</div>
                    </div>
                </td>
                <td>${this.getCategoryName(product.category)}</td>
                <td>${this.getSectionName(product.section)}</td>
                <td>${product.price.toLocaleString()} ₽</td>
                <td>${product.badge || '-'}</td>
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
                    </div>
                </td>
            </tr>
        `).join('');

        // Обновляем счетчик
        const counter = document.getElementById('productCounter');
        if (counter) {
            counter.textContent = `Товаров: ${this.products.length}/35`;
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
                        <button class="btn-edit">
                            <i class="fas fa-edit"></i> Изменить
                        </button>
                        <button class="btn-delete">
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

    getCategoryName(category) {
        const categories = {
            'pantograph': 'Пантографы',
            'wardrobe': 'Гардеробные системы',
            'premium': 'Премиум коллекция'
        };
        return categories[category] || category;
    }

    getSectionName(sectionCode) {
        const section = this.sections.find(s => s.code === sectionCode);
        return section ? section.name : sectionCode;
    }

    openProductModal() {
        document.getElementById('productModal').classList.add('active');
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    editProduct(id) {
        this.showNotification('Функция редактирования в разработке', 'info');
    }

    deleteProduct(id) {
        if (confirm('Вы уверены, что хотите удалить этот товар?')) {
            this.products = this.products.filter(p => p.id !== id);
            this.renderProducts();
            this.showNotification('Товар удален', 'success');
        }
    }
}

// Инициализация
let adminPanel;
document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
});