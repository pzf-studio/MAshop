from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import json
import os
import logging
from datetime import datetime
import hashlib
import secrets

app = Flask(__name__)
CORS(app)

# Конфигурация
CONFIG = {
    'DATA_FILE': 'DataBs.txt',
    'TELEGRAM_BOT_TOKEN': os.getenv('TELEGRAM_BOT_TOKEN', ''),
    'TELEGRAM_CHAT_ID': os.getenv('TELEGRAM_CHAT_ID', ''),
    'ADMIN_USERNAME': os.getenv('ADMIN_USERNAME', 'admin'),
    'ADMIN_PASSWORD_HASH': os.getenv('ADMIN_PASSWORD_HASH', '')
}

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

class DataManager:
    def __init__(self, data_file):
        self.data_file = data_file
        self.products = []
        self.sections = []
        self.load_data()
    
    def load_data(self):
        try:
            if os.path.exists(self.data_file):
                with open(self.data_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.products = data.get('products', [])
                    self.sections = data.get('sections', [])
            logger.info(f"Загружено {len(self.products)} товаров и {len(self.sections)} разделов")
        except Exception as e:
            logger.error(f"Ошибка загрузки данных: {e}")
            self.products = []
            self.sections = []
    
    def save_data(self):
        try:
            data = {
                'products': self.products,
                'sections': self.sections,
                'last_updated': datetime.now().isoformat()
            }
            with open(self.data_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            logger.info("Данные успешно сохранены")
            return True
        except Exception as e:
            logger.error(f"Ошибка сохранения данных: {e}")
            return False
    
    def get_products(self, active_only=True):
        if active_only:
            return [p for p in self.products if p.get('active', True)]
        return self.products
    
    def get_product_by_id(self, product_id):
        return next((p for p in self.products if p['id'] == product_id), None)
    
    def add_product(self, product_data):
        try:
            product_id = max([p['id'] for p in self.products], default=0) + 1
            product = {
                'id': product_id,
                'name': product_data['name'],
                'price': product_data['price'],
                'category': product_data['category'],
                'section': product_data.get('section', 'all'),
                'description': product_data.get('description', ''),
                'badge': product_data.get('badge', ''),
                'active': product_data.get('active', True),
                'featured': product_data.get('featured', False),
                'stock': product_data.get('stock', 0),
                'sku': product_data.get('sku', f'MF-{product_id}'),
                'images': product_data.get('images', []),
                'features': product_data.get('features', []),
                'specifications': product_data.get('specifications', {}),
                'createdAt': datetime.now().isoformat(),
                'updatedAt': datetime.now().isoformat()
            }
            self.products.append(product)
            return self.save_data(), product_id
        except Exception as e:
            logger.error(f"Ошибка добавления товара: {e}")
            return False, None
    
    def update_product(self, product_id, product_data):
        try:
            product = self.get_product_by_id(product_id)
            if not product:
                return False
            
            for key, value in product_data.items():
                product[key] = value
            product['updatedAt'] = datetime.now().isoformat()
            
            return self.save_data()
        except Exception as e:
            logger.error(f"Ошибка обновления товара: {e}")
            return False
    
    def delete_product(self, product_id):
        try:
            self.products = [p for p in self.products if p['id'] != product_id]
            return self.save_data()
        except Exception as e:
            logger.error(f"Ошибка удаления товара: {e}")
            return False

class TelegramNotifier:
    def __init__(self, bot_token, chat_id):
        self.bot_token = bot_token
        self.chat_id = chat_id
    
    def send_order_notification(self, order_data):
        if not self.bot_token or not self.chat_id:
            logger.warning("Telegram credentials not configured")
            return False
        
        try:
            message = self.format_order_message(order_data)
            # Здесь должна быть реализация отправки в Telegram
            # Например, через requests к Telegram Bot API
            logger.info(f"Telegram notification prepared: {message}")
            return True
        except Exception as e:
            logger.error(f"Ошибка отправки в Telegram: {e}")
            return False
    
    def format_order_message(self, order_data):
        message = "🛒 НОВЫЙ ЗАКАЗ MA FURNITURE\n\n"
        
        for item in order_data.get('items', []):
            message += f"• {item['name']}\n"
            message += f"  Количество: {item['quantity']} шт.\n"
            message += f"  Цена: {item['price']} ₽\n\n"
        
        message += f"💰 ИТОГО: {order_data.get('total', 0)} ₽\n"
        message += f"👤 Клиент: {order_data.get('customer_name', '')}\n"
        message += f"📞 Телефон: {order_data.get('customer_phone', '')}\n"
        message += f"📧 Email: {order_data.get('customer_email', '')}\n"
        message += f"📅 {datetime.now().strftime('%d.%m.%Y %H:%M')}"
        
        return message

# Инициализация менеджеров
data_manager = DataManager(CONFIG['DATA_FILE'])
telegram_notifier = TelegramNotifier(CONFIG['TELEGRAM_BOT_TOKEN'], CONFIG['TELEGRAM_CHAT_ID'])

# API Routes
@app.route('/api/products', methods=['GET'])
def get_products():
    try:
        active_only = request.args.get('active_only', 'true').lower() == 'true'
        products = data_manager.get_products(active_only)
        return jsonify({'success': True, 'products': products})
    except Exception as e:
        logger.error(f"Ошибка получения товаров: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    try:
        product = data_manager.get_product_by_id(product_id)
        if product:
            return jsonify({'success': True, 'product': product})
        return jsonify({'success': False, 'error': 'Товар не найден'}), 404
    except Exception as e:
        logger.error(f"Ошибка получения товара: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/products', methods=['POST'])
def create_product():
    try:
        product_data = request.get_json()
        success, product_id = data_manager.add_product(product_data)
        
        if success:
            return jsonify({'success': True, 'product_id': product_id})
        return jsonify({'success': False, 'error': 'Ошибка создания товара'}), 500
    except Exception as e:
        logger.error(f"Ошибка создания товара: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/orders', methods=['POST'])
def create_order():
    try:
        order_data = request.get_json()
        
        # Валидация данных заказа
        required_fields = ['items', 'customer_name', 'customer_phone']
        for field in required_fields:
            if not order_data.get(field):
                return jsonify({'success': False, 'error': f'Отсутствует поле: {field}'}), 400
        
        # Отправка уведомления в Telegram
        telegram_success = telegram_notifier.send_order_notification(order_data)
        
        # Здесь можно добавить сохранение заказа в базу данных
        
        return jsonify({
            'success': True, 
            'telegram_sent': telegram_success,
            'message': 'Заказ успешно создан'
        })
    except Exception as e:
        logger.error(f"Ошибка создания заказа: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'products_count': len(data_manager.products),
        'sections_count': len(data_manager.sections)
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)