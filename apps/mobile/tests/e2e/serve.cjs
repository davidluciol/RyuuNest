// Sirve el export web con fallback SPA, solo en loopback, sin dependencias nuevas.
const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const root = path.resolve(__dirname, "../../dist");
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".ttf": "font/ttf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

http
  .createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
      const file = path.resolve(root, `.${pathname}`);
      if (file !== root && !file.startsWith(root + path.sep)) {
        response.writeHead(403).end();
        return;
      }
      const target = path.extname(file) ? file : path.join(root, "index.html");
      const bytes = await fs.readFile(target);
      response.writeHead(200, {
        "Content-Type": types[path.extname(target)] || "application/octet-stream",
      });
      response.end(bytes);
    } catch {
      response.writeHead(404).end();
    }
  })
  .listen(8082, "127.0.0.1", () => console.log("Export web: http://127.0.0.1:8082"));
