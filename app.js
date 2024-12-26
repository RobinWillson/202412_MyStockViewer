const express = require('express');
const path = require('path');
const fs = require('fs').promises;
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
  const files = await fs.readdir(directoryPath);
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
app.get('/class-info', async (req, res) => {
  const filePath = path.join(__dirname, './B01_Class/classInfo.json');
  try {
    const data = await fs.readFile(filePath, 'utf8');
    const classInfo = JSON.parse(data);
    res.json(classInfo);
  } catch (err) {
    res.status(500).send('Error reading classInfo.json');
  }
});

app.post('/update-class-info', express.json(), async (req, res) => {
  const newClassInfo = req.body;
  const filePath = path.join(__dirname, './B01_Class/classInfo.json');
  try {
    await fs.writeFile(filePath, JSON.stringify(newClassInfo, null, 2));
    res.status(200).send('classInfo.json updated.');
  } catch (err) {
    res.status(500).send('Error writing to classInfo.json');
  }
});

// Error handling
app.use((req, res, next) => {
  res.status(404).render('error', { message: 'Page not found' });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

module.exports = app;