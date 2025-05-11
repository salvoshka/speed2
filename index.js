// index.js
const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const app = express();

// Melayani file statis dari folder public (termasuk index.html dan assets)
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint API yang memanggil fast-cli dan mengembalikan hasil speed test sebagai JSON
app.get('/test', (req, res) => {
  // Jalankan perintah fast-cli (harus sudah terinstal secara global)
  exec('fast --upload --json', (err, stdout, stderr) => {
    if (err) {
      console.error('Speed test error:', stderr);
      return res.status(500).json({ error: 'Speed test failed', details: stderr });
    }

    try {
      const data = JSON.parse(stdout);
      const download = data.downloadSpeed || 0;
      const upload = data.uploadSpeed || 0;

      res.json({
        downloadSpeed: parseFloat(download.toFixed(2)),
        uploadSpeed: parseFloat(upload.toFixed(2))
      });
    } catch (e) {
      console.error('JSON parse error:', e.message);
      res.status(500).json({ error: 'Failed to parse result', message: e.message });
    }
  });
});

// Jalankan server di port 4000
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ SpeedTest server running at http://localhost:${PORT}`);
});
