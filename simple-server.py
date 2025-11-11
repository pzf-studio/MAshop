import http.server
import socketserver
import json
import os
from datetime import datetime

PORT = 8000

class SimpleHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/api/'):
            self.handle_api_request()
        else:
            super().do_GET()
    
    def handle_api_request(self):
        if self.path == '/api/products':
            self.send_products()
        elif self.path.startswith('/api/products/'):
            self.send_product()
        elif self.path == '/api/health':
            self.send_health()
        else:
            self.send_error(404, "API endpoint not found")
    
    def send_products(self):
        try:
            # Пробуем прочитать из DataBs.txt
            products = []
            if os.path.exists('DataBs.txt'):
                with open('DataBs.txt', 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    products = data.get('products', [])
            
            response = {
                'success': True,
                'products': products,
                'timestamp': datetime.now().isoformat()
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            self.send_error(500, f"Server error: {str(e)}")
    
    def send_product(self):
        # Базовая реализация для тестирования
        product_id = self.path.split('/')[-1]
        response = {
            'success': True,
            'product': {
                'id': int(product_id),
                'name': f'Тестовый товар {product_id}',
                'price': 10000,
                'category': 'test'
            }
        }
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode('utf-8'))
    
    def send_health(self):
        response = {
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'server': 'Simple Python Server'
        }
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode('utf-8'))

def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("", PORT), SimpleHandler) as httpd:
        print(f"Сервер запущен на http://localhost:{PORT}")
        print("Для остановки нажмите Ctrl+C")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nСервер остановлен")

if __name__ == "__main__":
    main()