const http = require('http');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Fungsi untuk melayani file statis
function serveStaticFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
}

// Buat server HTTP
const server = http.createServer((req, res) => {
  if (req.url === '/') {
    // Layani file index.html
    serveStaticFile(res, path.join(__dirname, 'public', 'index.html'), 'text/html');
  } else if (req.url === '/test') {
    // Endpoint API untuk menjalankan fast-cli
    exec('fast --upload --json', (err, stdout, stderr) => {
      if (err) {
        console.error('Speed test error:', stderr);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Speed test failed', details: stderr }));
        return;
      }

      try {
        // Parse hasil JSON dari fast-cli
        const data = JSON.parse(stdout);
        const download = data.downloadSpeed || 0;
        const upload = data.uploadSpeed || 0;

        // Kirim hasil sebagai JSON
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          downloadSpeed: parseFloat(download.toFixed(2)),
          uploadSpeed: parseFloat(upload.toFixed(2))
        }));
      } catch (e) {
        console.error('JSON parse error:', e.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to parse result', message: e.message }));
      }
    });
  } else {
    // Layani file statis lainnya (CSS, JS, dll.)
    const filePath = path.join(__dirname, 'public', req.url);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
    }[ext] || 'application/octet-stream';

    serveStaticFile(res, filePath, contentType);
  }
});

// Jalankan server di port 4000
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`✅ SpeedTest server running at http://localhost:${PORT}`);
});