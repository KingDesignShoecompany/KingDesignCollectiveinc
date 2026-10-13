import http.server, socketserver, os
ROOT = os.environ.get("KDC_ROOT", os.path.join(os.path.dirname(os.path.abspath(__file__)), "out"))
PREFIX = "/KingDesignCollectiveinc"

class H(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        p = path.split("?", 1)[0]
        if p.startswith(PREFIX):
            p = p[len(PREFIX):] or "/"
        elif p == PREFIX:
            p = "/"
        p = p.replace("\\", "/")
        full = os.path.join(ROOT, p.lstrip("/").replace("/", os.sep))
        if os.path.isdir(full):
            full = os.path.join(full, "index.html")
        return full

    def log_message(self, *a):
        pass

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("127.0.0.1", 8898), H) as httpd:
    httpd.serve_forever()
