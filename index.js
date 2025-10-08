// Данные товаров из каталога
const catalogProducts = [
    {
        id: 1,
        name: "Электрический пантограф Deluxe",
        category: "pantograph",
        price: 45000,
        badge: "Хит",
        active: true,
        features: ["Сенсорное управление", "Грузоподъемность 20кг", "Итальянская экокожа"]
    },
    {
        id: 2,
        name: "Глубокий ящик Nuomi Hera",
        category: "wardrobe",
        price: 25000,
        badge: "Новинка",
        active: true,
        features: ["Вместимость 50л", "Алюминий и экокожа", "Направляющие Hettich"]
    },
    {
        id: 3,
        name: "Вращающаяся обувница",
        category: "shoerack",
        price: 35000,
        badge: "Популярное",
        active: true,
        features: ["Поворот 360°", "10-12 полок", "Регулируемая высота"]
    },
    {
        id: 4,
        name: "Брючница Nuomi Hera",
        category: "wardrobe",
        price: 22000,
        active: true,
        features: ["10 перекладин", "Регулируемые элементы", "Экокожа с прострочкой"]
    },
    {
        id: 5,
        name: "Кухонный лифт для аксессуаров",
        category: "kitchen",
        price: 28000,
        active: true,
        features: ["LED подсветка", "Сенсорное управление", "Авиационный алюминий"]
    },
    {
        id: 6,
        name: "Электрический пантограф Basic",
        category: "pantograph",
        price: 38000,
        badge: "Выбор",
        active: true,
        features: ["Автоматический спуск", "Бесшумный механизм", "Стандартные цвета"]
    },
    {
        id: 7,
        name: "Ящик для нижнего белья Nuomi Ralphie",
        category: "wardrobe",
        price: 19500,
        active: true,
        features: ["Многосекционный", "Экокожа Bordeaux", "Нагрузка 15кг"]
    },
    {
        id: 8,
        name: "Угловой органайзер Nuomi Hera",
        category: "wardrobe",
        price: 42000,
        badge: "Эксклюзив",
        active: true,
        features: ["Поворот 360°", "Максимальное использование", "Коричневая экокожа"]
    }
];

// Сохраняем товары в localStorage при первой загрузке
function initializeProducts() {
    if (!localStorage.getItem('products')) {
        localStorage.setItem('products', JSON.stringify(catalogProducts));
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initializeProducts();
    
    // Плавная прокрутка для якорных ссылок
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // FAQ аккордеон
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Закрываем все элементы
            faqItems.forEach(otherItem => {
                otherItem.classList.remove('active');
            });
            
            // Открываем текущий, если он был закрыт
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
    
    // Скрытие статичного логотипа при скролле
    const header = document.getElementById('main-header');
    const staticLogo = document.querySelector('.static-logo');
    
    if (header && staticLogo) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 100) {
                staticLogo.style.opacity = '0';
            } else {
                staticLogo.style.opacity = '1';
            }
        });
    }
    
    // Галерея товаров
    const gallerySlides = document.querySelectorAll('.gallery-slide');
    const galleryDotsContainer = document.querySelector('.gallery-dots');
    const prevButton = document.querySelector('.gallery-nav.prev');
    const nextButton = document.querySelector('.gallery-nav.next');
    
    let currentSlide = 0;
    
    // Создание индикаторов для галереи
    if (gallerySlides.length > 0 && galleryDotsContainer) {
        gallerySlides.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.classList.add('gallery-dot');
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goToSlide(index));
            galleryDotsContainer.appendChild(dot);
        });
    }
    
    const dots = document.querySelectorAll('.gallery-dot');
    
    function goToSlide(index) {
        gallerySlides[currentSlide].classList.remove('active');
        if (dots.length > 0) dots[currentSlide].classList.remove('active');
        
        currentSlide = index;
        
        gallerySlides[currentSlide].classList.add('active');
        if (dots.length > 0) dots[currentSlide].classList.add('active');
    }
    
    function nextSlide() {
        let nextIndex = currentSlide + 1;
        if (nextIndex >= gallerySlides.length) nextIndex = 0;
        goToSlide(nextIndex);
    }
    
    function prevSlide() {
        let prevIndex = currentSlide - 1;
        if (prevIndex < 0) prevIndex = gallerySlides.length - 1;
        goToSlide(prevIndex);
    }
    
    if (prevButton && nextButton) {
        prevButton.addEventListener('click', prevSlide);
        nextButton.addEventListener('click', nextSlide);
    }
    
    // Автопрокрутка галереи
    let galleryInterval;
    if (gallerySlides.length > 0) {
        galleryInterval = setInterval(nextSlide, 5000);
    }
    
    // Остановка автопрокрутки при наведении
    const galleryContainer = document.querySelector('.gallery-container');
    if (galleryContainer) {
        galleryContainer.addEventListener('mouseenter', () => {
            clearInterval(galleryInterval);
        });
        
        galleryContainer.addEventListener('mouseleave', () => {
            galleryInterval = setInterval(nextSlide, 5000);
        });
    }
    
    // Анимация появления элементов при скролле
    const fadeElements = document.querySelectorAll('.fade-in');
    
    const fadeInObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });
    
    fadeElements.forEach(element => {
        fadeInObserver.observe(element);
    });
    
    // Анимация для кнопок при наведении
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Загрузка случайных товаров для мини-превью
    loadRandomProducts();
});

// Функция для загрузки случайных товаров
function loadRandomProducts() {
    const productsGrid = document.getElementById('randomProductsGrid');
    if (!productsGrid) return;

    // Получаем активные товары из localStorage
    const activeProducts = getActiveProducts();
    
    // Если нет товаров, показываем заглушку
    if (activeProducts.length === 0) {
        productsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #666;">
                <i class="fas fa-box-open" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <h3>Товары скоро появятся</h3>
                <p>Наши эксклюзивные коллекции готовятся к показу</p>
            </div>
        `;
        return;
    }

    // Выбираем 3 случайных товара
    const randomProducts = getRandomProducts(activeProducts, 3);
    
    // Очищаем контейнер
    productsGrid.innerHTML = '';
    
    // Создаем карточки для каждого случайного товара
    randomProducts.forEach(product => {
        const productCard = createRandomProductCard(product);
        productsGrid.appendChild(productCard);
    });
}

// Функция для получения активных товаров
function getActiveProducts() {
    let products = [];
    
    try {
        products = JSON.parse(localStorage.getItem('products')) || catalogProducts;
    } catch (error) {
        console.error('Load products error:', error);
        products = catalogProducts;
    }
    
    // Фильтруем только активные товары
    return products.filter(product => product.active === true);
}

// Функция для выбора случайных товаров
function getRandomProducts(products, count) {
    const shuffled = [...products].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Функция для создания карточки случайного товара
function createRandomProductCard(product) {
    const card = document.createElement('div');
    card.className = 'random-product-card fade-in';
    
    const categoryNames = {
        'pantograph': 'Электрический пантограф',
        'wardrobe': 'Система хранения',
        'shoerack': 'Обувница',
        'kitchen': 'Кухонный лифт',
        'premium': 'Премиум коллекция'
    };
    
    const categoryIcon = {
        'pantograph': 'fas fa-tshirt',
        'wardrobe': 'fas fa-archive',
        'shoerack': 'fas fa-shoe-prints',
        'kitchen': 'fas fa-utensils',
        'premium': 'fas fa-crown'
    };
    
    const badge = product.badge ? `<div class="random-product-badge">${product.badge}</div>` : '';
    
    // Создаем HTML для характеристик
    const featuresHTML = product.features ? product.features.map(feature => 
        `<li>${feature}</li>`
    ).join('') : `
        <li>Премиальные материалы</li>
        <li>Эксклюзивный дизайн</li>
        <li>Индивидуальный подход</li>
    `;
    
    card.innerHTML = `
        <div class="random-product-image">
            <i class="${categoryIcon[product.category] || 'fas fa-cube'}"></i>
            ${badge}
        </div>
        <div class="random-product-content">
            <div class="random-product-category">${categoryNames[product.category] || product.category}</div>
            <h3 class="random-product-title">${product.name}</h3>
            <div class="random-product-price">${formatPrice(product.price)}</div>
            <ul class="random-product-features">
                ${featuresHTML}
            </ul>
            <div class="random-product-actions">
                <a href="shop.html" class="btn btn-primary btn-small">
                    <i class="fas fa-shopping-cart"></i> Подробнее
                </a>
                <a href="https://t.me/Ma_Furniture_ru" class="btn btn-secondary btn-small">
                    <i class="fab fa-telegram-plane"></i> Заказать
                </a>
            </div>
        </div>
    `;
    
    return card;
}

// Функция для форматирования цены
function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

// Обновляем товары при изменении в админке
window.addEventListener('message', function(event) {
    if (event.data.type === 'PRODUCTS_UPDATED') {
        loadRandomProducts();
    }
});