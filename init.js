// init.js - Инициализация приложения MA Furniture
console.log('MA Furniture - Инициализация приложения');

// Ждем загрузки всех скриптов
window.addEventListener('DOMContentLoaded', function() {
    console.log(`Инициализировано ${dataManager.getProducts().length} товаров`);
});