import http.server
import socketserver
import sys

PORT = 8000

class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("", PORT), NoCacheHTTPRequestHandler) as httpd:
    print(f"Serving HTTP on port {PORT} with strict no-cache headers...")
    sys.stdout.flush()
    httpd.serve_forever()
