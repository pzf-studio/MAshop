from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS
import os
import logging
import json
import requests
from datetime import datetime

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)  # Добавляем CORS поддержку

# Конфигурация Telegram бота
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', 'YOUR_BOT_TOKEN_HERE')
TELEGRAM_CHAT_ID = os.getenv('TELEGRAM_CHAT_ID', 'YOUR_CHAT_ID_HERE')
TELEGRAM_API_URL = f'https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage'

class OrderManager:
    def __init__(self):
        self.orders_file = 'orders.json'
    
    def save_order(self, order_data):
        """Сохраняет заказ в JSON файл"""
        try:
            # Загружаем существующие заказы
            orders = self.load_orders()
            
            # Добавляем новый заказ
            order_data['id'] = self.generate_order_id()
            order_data['created_at'] = datetime.now().isoformat()
            order_data['status'] = 'new'
            
            orders.append(order_data)
            
            # Сохраняем обратно
            with open(self.orders_file, 'w', encoding='utf-8') as f:
                json.dump(orders, f, ensure_ascii=False, indent=2)
            
            logger.info(f"Order saved with ID: {order_data['id']}")
            return order_data['id']
        except Exception as e:
            logger.error(f"Error saving order: {e}")
            return None
    
    def load_orders(self):
        """Загружает заказы из JSON файла"""
        try:
            if os.path.exists(self.orders_file):
                with open(self.orders_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return []
        except Exception as e:
            logger.error(f"Error loading orders: {e}")
            return []
    
    def generate_order_id(self):
        """Генерирует ID заказа"""
        orders = self.load_orders()
        return len(orders) + 1

class TelegramService:
    def __init__(self):
        self.bot_token = TELEGRAM_BOT_TOKEN
        self.chat_id = TELEGRAM_CHAT_ID
        self.api_url = TELEGRAM_API_URL
    
    def send_order(self, order_data):
        """Отправляет заказ в Telegram"""
        try:
            message = self.format_order_message(order_data)
            
            payload = {
                'chat_id': self.chat_id,
                'text': message,
                'parse_mode': 'HTML'
            }
            
            logger.info(f"Sending order to Telegram: {order_data.get('id', 'new')}")
            response = requests.post(self.api_url, json=payload, timeout=10)
            result = response.json()
            
            if result.get('ok'):
                logger.info(f"Order successfully sent to Telegram, message ID: {result['result']['message_id']}")
                return {
                    'success': True,
                    'message_id': result['result']['message_id'],
                    'telegram_sent': True
                }
            else:
                error_msg = result.get('description', 'Unknown error')
                logger.error(f"Telegram API error: {error_msg}")
                return {
                    'success': False,
                    'error': error_msg,
                    'telegram_sent': False
                }
                
        except Exception as e:
            logger.error(f"Error sending to Telegram: {e}")
            return {
                'success': False,
                'error': str(e),
                'telegram_sent': False
            }
    
    def format_order_message(self, order_data):
        """Форматирует сообщение для Telegram"""
        def format_price(price):
            return f"{price:,.0f} ₽".replace(',', ' ')
        
        message = "<b>🛒 НОВЫЙ ЗАКАЗ MA FURNITURE</b>\n\n"
        
        # Информация о товарах
        message += "<b>📦 Состав заказа:</b>\n"
        for i, item in enumerate(order_data['items'], 1):
            message += f"{i}. <b>{self.escape_html(item['name'])}</b>\n"
            message += f"   Количество: {item['quantity']} шт.\n"
            message += f"   Цена за шт: {format_price(item['price'])}\n"
            message += f"   Сумма: {format_price(item['price'] * item['quantity'])}\n\n"
        
        message += f"<b>💰 ОБЩАЯ СУММА: {format_price(order_data['total'])}</b>\n\n"
        
        # Информация о клиенте
        message += "<b>👤 Данные клиента:</b>\n"
        message += f"ФИО: {self.escape_html(order_data['customer_name'])}\n"
        message += f"Телефон: {self.escape_html(order_data['customer_phone'])}\n"
        
        if order_data.get('customer_email'):
            message += f"Email: {self.escape_html(order_data['customer_email'])}\n"
        
        if order_data.get('customer_address'):
            message += f"Адрес: {self.escape_html(order_data['customer_address'])}\n"
        
        if order_data.get('customer_comment'):
            message += f"Комментарий: {self.escape_html(order_data['customer_comment'])}\n"
        
        message += f"\n📅 {datetime.now().strftime('%d.%m.%Y %H:%M')}"
        message += f"\n\n🌐 <i>Заказ с сайта: {order_data.get('source', 'MA Furniture')}</i>"
        
        return message
    
    def escape_html(self, text):
        """Экранирует HTML символы"""
        if not text:
            return ''
        return (str(text)
                .replace('&', '&amp;')
                .replace('<', '&lt;')
                .replace('>', '&gt;')
                .replace('"', '&quot;')
                .replace("'", '&#039;'))

# Инициализация сервисов
order_manager = OrderManager()
telegram_service = TelegramService()

# Существующие маршруты для статических файлов
@app.route('/')
def index():
    logger.info("Serving index.html")
    return send_from_directory('.', 'index.html')

@app.route('/shop')
def shop():
    logger.info("Serving shop.html")
    return send_from_directory('.', 'shop.html')

@app.route('/piece')
def product():
    logger.info("Serving piece.html")
    return send_from_directory('.', 'piece.html')

@app.route('/admin')
def admin():
    logger.info("Serving admin.html")
    return send_from_directory('.', 'admin.html')

@app.route('/admin-login')
def admin_login():
    logger.info("Serving admin-login.html")
    return send_from_directory('.', 'admin-login.html')

# Новый маршрут для обработки заказов
@app.route('/api/orders', methods=['POST', 'OPTIONS'])
def create_order():
    """Обрабатывает создание заказа"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        order_data = request.get_json()
        logger.info(f"Received order request: {order_data.get('customer_name', 'Unknown')}")
        
        # Валидация обязательных полей
        required_fields = ['customer_name', 'customer_phone', 'items', 'total']
        for field in required_fields:
            if not order_data.get(field):
                error_msg = f'Отсутствует обязательное поле: {field}'
                logger.warning(f"Validation failed: {error_msg}")
                return jsonify({
                    'success': False,
                    'error': error_msg
                }), 400
        
        # Добавляем информацию об источнике
        order_data['source'] = 'MA Furniture Website'
        order_data['user_agent'] = request.headers.get('User-Agent', 'Unknown')
        
        # Сохраняем заказ
        order_id = order_manager.save_order(order_data)
        if not order_id:
            return jsonify({
                'success': False,
                'error': 'Ошибка сохранения заказа'
            }), 500
        
        # Отправляем в Telegram
        telegram_result = telegram_service.send_order(order_data)
        
        if telegram_result['success']:
            return jsonify({
                'success': True,
                'order_id': order_id,
                'telegram_sent': True,
                'message': 'Заказ успешно создан и отправлен'
            })
        else:
            # Заказ сохранен, но не отправлен в Telegram
            logger.warning(f"Order saved but Telegram failed: {telegram_result.get('error')}")
            return jsonify({
                'success': True,
                'order_id': order_id,
                'telegram_sent': False,
                'warning': 'Заказ создан, но не отправлен в Telegram',
                'error': telegram_result.get('error')
            })
            
    except Exception as e:
        logger.error(f"Error processing order: {e}")
        return jsonify({
            'success': False,
            'error': 'Внутренняя ошибка сервера'
        }), 500

# Health check для Amvera
@app.route('/health')
def health():
    return {"status": "healthy", "message": "MA Furniture is running"}

# Новый health check с проверкой Telegram
@app.route('/api/health')
def api_health():
    """Расширенный health check для API"""
    telegram_status = "unknown"
    try:
        # Проверяем доступность Telegram API
        test_url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getMe"
        response = requests.get(test_url, timeout=5)
        telegram_status = "connected" if response.json().get('ok') else "disconnected"
    except:
        telegram_status = "error"
    
    return jsonify({
        "status": "healthy",
        "service": "MA Furniture API",
        "telegram": telegram_status,
        "timestamp": datetime.now().isoformat()
    })

# Обслуживаем все статические файлы
@app.route('/<path:path>')
def serve_static(path):
    logger.info(f"Serving static file: {path}")
    try:
        return send_from_directory('.', path)
    except Exception as e:
        logger.error(f"Error serving {path}: {e}")
        return "File not found", 404

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    logger.info(f"Starting MA Furniture app on port {port}")
    logger.info(f"Telegram Bot Token: {'SET' if TELEGRAM_BOT_TOKEN != 'YOUR_BOT_TOKEN_HERE' else 'NOT SET'}")
    logger.info(f"Telegram Chat ID: {'SET' if TELEGRAM_CHAT_ID != 'YOUR_CHAT_ID_HERE' else 'NOT SET'}")
    app.run(host='0.0.0.0', port=port, debug=False)