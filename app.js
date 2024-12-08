const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

app.use(express.static('public'));

app.get('/stockPrice/:stockCode', (req, res) => {
  const stockCode = req.params.stockCode;
  const directoryPath = path.join(__dirname, '../A01_StockPrice_test');
  console.log('directoryPath:', directoryPath);
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      return res.status(500).send('Unable to scan directory');
    }

    const fileName = files.find(file => file.startsWith(stockCode));
    if (!fileName) {
      return res.status(404).send('File not found');
    }

    const filePath = path.join(directoryPath, fileName);
    res.sendFile(filePath);
  });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});