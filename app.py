from flask import Flask, send_from_directory
import os

app = Flask(__name__, static_folder='.', static_url_path='')

# Конфигурация
app.config['SECRET_KEY'] = 'ma-furniture-secret-key-2024'

# Основные маршруты
@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/shop')
def shop():
    return app.send_static_file('shop.html')

@app.route('/piece')
def product():
    return app.send_static_file('piece.html')

@app.route('/admin')
def admin():
    return app.send_static_file('admin.html')

@app.route('/admin-login')
def admin_login():
    return app.send_static_file('admin-login.html')

# Статические файлы - обслуживаем все файлы
@app.route('/<path:filename>')
def serve_static(filename):
    try:
        return app.send_static_file(filename)
    except:
        return "File not found", 404

# API маршруты (заглушки)
@app.route('/api/products')
def api_products():
    return {"success": True, "products": []}

@app.route('/api/orders', methods=['POST'])
def api_orders():
    return {"success": True, "message": "Order received"}

@app.route('/api/auth', methods=['POST'])
def api_auth():
    return {"success": True, "authenticated": True}

# Обработка ошибок
@app.errorhandler(404)
def not_found(error):
    return app.send_static_file('index.html')

if __name__ == '__main__':
    # Amvera сам управляет портом через переменную окружения PORT
    port = int(os.environ.get('PORT', 5000))
    
    # Важно: 0.0.0.0 для работы в контейнере
    app.run(host='0.0.0.0', port=port, debug=False)