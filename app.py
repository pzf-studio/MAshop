from flask import Flask, send_from_directory
import os
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='.', static_url_path='')

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

# Обслуживаем все статические файлы
@app.route('/<path:path>')
def serve_static(path):
    logger.info(f"Serving static file: {path}")
    try:
        return send_from_directory('.', path)
    except Exception as e:
        logger.error(f"Error serving {path}: {e}")
        return "File not found", 404

# Health check для Amvera
@app.route('/health')
def health():
    return {"status": "healthy", "message": "MA Furniture is running"}

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    logger.info(f"Starting MA Furniture app on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)