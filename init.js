// init.js - Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    console.log('MA Furniture - Инициализация приложения');
    
    // Принудительная синхронизация при загрузке
    setTimeout(() => {
        const productCount = forceSync();
        console.log(`Инициализировано ${productCount} товаров`);
    }, 100);
    
    // Периодическая синхронизация (каждые 30 секунд)
    setInterval(() => {
        forceSync();
    }, 30000);
});