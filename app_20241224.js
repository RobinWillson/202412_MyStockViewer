const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors'); // Import the cors package
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const app = express();
const port = process.env.PORT || 3000;;

app.use(cors()); // Use the cors middleware
app.use(express.static('public'));
// Set view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.get('/stockPrice/:stockCode', async (req, res) => {
  const stockCode = req.params.stockCode;
  const directoryPath = path.join(__dirname, '/A01_StockPrice');
  const files = await fs.readdirSync(directoryPath);
  const fileName = files.find(file => file.startsWith(stockCode));
  if (!fileName) {
    return res.status(404).send('File not found');
  }
  const filePath = path.join(directoryPath, fileName);
  res.sendFile(filePath);
});
app.get('/stock-list', (req, res) => {
  const fs = require('fs');
  const stockDir = path.join(__dirname, '/A01_StockPrice');
  fs.readdir(stockDir, (err, files) => {
    if (err) {
      return res.status(500).send('Unable to scan directory');
    }
    res.json(files);
  });
});
app.get('/class-info', (req, res) => {
  const classInfo = require('./B01_Class/classInfo.json');
  res.json(classInfo);
});

// Error handling
app.use((req, res, next) => {
  res.status(404).render('error', { message: 'Page not found' });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

module.exports = app;