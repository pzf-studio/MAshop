document.addEventListener('DOMContentLoaded', function() {
    console.log('MA Furniture - Инициализация приложения');
    
    // Принудительная синхронизация при загрузке
    setTimeout(() => {
        try {
            const productCount = forceSync();
            console.log(`Инициализировано ${productCount} товаров`);
        } catch (error) {
            console.error('Ошибка инициализации:', error);
        }
    }, 100);
    
    // Периодическая синхронизация (каждые 30 секунд)
    setInterval(() => {
        try {
            forceSync();
        } catch (error) {
            console.error('Ошибка периодической синхронизации:', error);
        }
    }, 30000);
});