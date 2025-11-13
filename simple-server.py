import http.server
import socketserver
import os

PORT = int(os.environ.get('PORT', 5000))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory='.', **kwargs)

    def log_message(self, format, *args):
        print(f"{self.client_address[0]} - - [{self.log_date_time_string()}] {format % args}")

print(f"Starting MA Furniture static server on port {PORT}")
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Server ready at http://0.0.0.0:{PORT}")
    httpd.serve_forever()