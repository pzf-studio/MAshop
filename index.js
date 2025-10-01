let scrollTimeout;
let resizeTimeout;

document.addEventListener('DOMContentLoaded', function() {
    
    document.querySelectorAll('a[href^="#"], a[href^="index.html#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const href = this.getAttribute('href');
            let targetId;
            
            // Обрабатываем обе формы ссылок: #anchor и index.html#anchor
            if (href.includes('#')) {
                targetId = href.split('#')[1];
            } else {
                targetId = href;
            }
            
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                // Если мы на странице заказа, переходим на главную
                if (window.location.pathname.includes('order.html') && href.includes('index.html')) {
                    window.location.href = href;
                    return;
                }
                
                // Плавная прокрутка
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Обновляем URL без перезагрузки страницы
                history.pushState(null, null, '#' + targetId);
            }
        });
    });
    const fadeElements = document.querySelectorAll('.fade-in');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1
    });
    
    fadeElements.forEach(element => {
        element.style.opacity = 0;
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        observer.observe(element);
    });
    
    const btn = document.querySelector('.btn');
    if (btn) {
        btn.addEventListener('mouseover', function() {
            this.style.transform = 'translateY(-5px) scale(1.05)';
        });
        
        btn.addEventListener('mouseout', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    }
    
    
    const faqItems = document.querySelectorAll('.faq-accordion .faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });
            
            item.classList.toggle('active');
        });
    });
    
    const orderMenu = document.querySelector('.order-menu');
    const orderToggle = document.querySelector('.order-toggle');
    
    if (orderToggle) {
        orderToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            orderMenu.classList.toggle('active');
        });
        
        document.addEventListener('click', function(e) {
            if (!orderMenu.contains(e.target)) {
                orderMenu.classList.remove('active');
            }
        });
        
        document.querySelector('.order-dropdown')?.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
    
    const header = document.getElementById('main-header');
    const scrollThreshold = 100;
    
    if (header) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > scrollThreshold) {
                header.classList.add('header-scrolled');
                // Скрыть статичный логотип при скролле
                document.querySelector('.static-logo').style.opacity = '0';
            } else {
                header.classList.remove('header-scrolled');
                // Показать статичный логотип
                document.querySelector('.static-logo').style.opacity = '1';
            }
        });
        
        if (window.scrollY > scrollThreshold) {
            header.classList.add('header-scrolled');
            document.querySelector('.static-logo').style.opacity = '0';
        }
    }
});

function initReviews() {
    const reviewsTrack = document.querySelector('.reviews-track');
    const reviewCards = document.querySelectorAll('.review-card');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const indicators = document.querySelectorAll('.indicator');
    const currentReviewEl = document.querySelector('.current-review');
    const totalReviewsEl = document.querySelector('.total-reviews');
    
    if (!reviewsTrack || reviewCards.length === 0) return;
    
    let currentIndex = 0;
    const totalReviews = reviewCards.length;
    
    // Установка общего количества отзывов
    totalReviewsEl.textContent = totalReviews;
    
    // Функция обновления отображения отзывов
    function updateReviewDisplay() {
        reviewCards.forEach((card, index) => {
            card.classList.remove('active');
            if (index === currentIndex) {
                card.classList.add('active');
            }
        });
        
        // Обновление индикаторов
        indicators.forEach((indicator, index) => {
            indicator.classList.remove('active');
            if (index === currentIndex) {
                indicator.classList.add('active');
            }
        });
        
        // Обновление нумерации
        currentReviewEl.textContent = currentIndex + 1;
    }
    
    // Переход к следующему отзыву
    function nextReview() {
        currentIndex = (currentIndex + 1) % totalReviews;
        updateReviewDisplay();
    }
    
    // Переход к предыдущему отзыву
    function prevReview() {
        currentIndex = (currentIndex - 1 + totalReviews) % totalReviews;
        updateReviewDisplay();
    }
    
    // Обработчики событий для кнопок навигации
    if (nextBtn) nextBtn.addEventListener('click', nextReview);
    if (prevBtn) prevBtn.addEventListener('click', prevReview);
    
    // Обработчики для индикаторов
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            currentIndex = index;
            updateReviewDisplay();
        });
    });
    
    // Автопрокрутка отзывов (опционально)
    let autoPlayInterval;
    
    function startAutoPlay() {
        autoPlayInterval = setInterval(nextReview, 5000);
    }
    
    function stopAutoPlay() {
        clearInterval(autoPlayInterval);
    }
    
    // Запуск автопрокрутки
    startAutoPlay();
    
    // Остановка автопрокрутки при наведении на отзывы
    reviewsTrack.addEventListener('mouseenter', stopAutoPlay);
    reviewsTrack.addEventListener('mouseleave', startAutoPlay);
    
    // Инициализация
    updateReviewDisplay();
}

// Вызов функции инициализации при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    initReviews();
});

function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Закрываем все элементы
            faqItems.forEach(otherItem => {
                otherItem.classList.remove('active');
                otherItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
            });
            
            // Открываем текущий, если он был закрыт
            if (!isActive) {
                item.classList.add('active');
                question.setAttribute('aria-expanded', 'true');
            }
        });
    });
    
    // Добавляем обработчики для клавиатуры
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            faqItems.forEach(item => {
                item.classList.remove('active');
                item.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
            });
        }
    });
}

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    initFAQ();
});

function initCookieBanner() {
    const cookieBanner = document.getElementById('cookieBanner');
    if (cookieBanner) {
        // Проверяем, было ли уже принято решение по cookies
        const cookiesAccepted = localStorage.getItem('cookiesAccepted');
        const cookiesRejected = localStorage.getItem('cookiesRejected');

        if (!cookiesAccepted && !cookiesRejected) {
            // Показываем баннер только если решение еще не принято
            setTimeout(() => {
                cookieBanner.classList.add('active');
            }, 2000); // Появляется через 2 секунды после загрузки страницы
        }

        const acceptCookies = document.getElementById('acceptCookies');
        const rejectCookies = document.getElementById('rejectCookies');
        const cookieSettings = document.getElementById('cookieSettings');

        // Обработчик принятия cookies
        acceptCookies.addEventListener('click', () => {
            localStorage.setItem('cookiesAccepted', 'true');
            localStorage.setItem('cookiesRejected', 'false');
            cookieBanner.classList.remove('active');
            
            // Здесь можно добавить инициализацию аналитики и других сервисов
            initAnalytics();
        });

        // Обработчик отклонения cookies
        rejectCookies.addEventListener('click', () => {
            localStorage.setItem('cookiesAccepted', 'false');
            localStorage.setItem('cookiesRejected', 'true');
            cookieBanner.classList.remove('active');
        });

        // Обработчик настроек (можно расширить функционал)
        cookieSettings.addEventListener('click', () => {
            alert('Настройки cookies будут доступны в следующем обновлении.');
        });

        // Функция для инициализации аналитики (заглушка)
        function initAnalytics() {
            console.log('Analytics initialized - cookies accepted');
            // Здесь будет код для инициализации Google Analytics, Yandex.Metrica и т.д.
        }

        // Проверяем статус cookies при загрузке
        if (cookiesAccepted === 'true') {
            initAnalytics();
        }        
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initCookieBanner();
});

// Функция для проверки принятия cookies (можно использовать в других местах)
function areCookiesAccepted() {
    return localStorage.getItem('cookiesAccepted') === 'true';
}

// Функция для принудительного показа баннера (для тестирования)
function showCookieBanner() {
    const cookieBanner = document.getElementById('cookieBanner');
    cookieBanner.classList.add('active');
}

function optimizeForMobile() {
    // Отключаем ненужные анимации на слабых устройствах
    if ('connection' in navigator) {
        const connection = navigator.connection;
        if (connection.saveData || connection.effectiveType.includes('2g')) {
            document.documentElement.classList.add('save-data');
        }
    }
    
    // Оптимизация для touch устройств
    if ('ontouchstart' in window) {
        document.documentElement.classList.add('touch-device');
    }
    
    // Предотвращение масштабирования при двойном тапе (опционально)
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    optimizeForMobile();
});