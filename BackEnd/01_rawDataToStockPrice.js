/**
 * 抓取 html每日收盤行情資料, 太容易失敗
 * 檢查是否有失敗的資料太麻煩
 * 改用02_retrievePrice.js
 * 這個檔案可以將每日收盤行情資料轉換成個股檔案
 * 例如 0050_元大台灣50.json
 * 只要讀取一個html檔案, 就可以轉換成多個個股檔案
 * 每個月要跑一次, 以免有的股票休息, 沒抓到資料
 */

const fs = require('fs').promises;
const path = require('path');
// use [npm root -g] to get the global node_modules path
const globalNodeModulesPath = 'C:/Users/9910008/AppData/Roaming/npm/node_modules';
const cheerio = require(path.join(globalNodeModulesPath, 'cheerio'));

// const cheerio = require('cheerio');

async function main() {
  // get all file name and file size in ./A00_rawData
  // ignore the file with size <1MB
  const filePath = "../A00_rawData/20241111_StockDaily.html";
  const stats = await fs.stat(filePath);
  console.log('File size in bytes:', stats.size);
  if (stats.size < 1 * 1024 * 1024) {
    console.log('File size is less than 1MB, ignoring the file.');
    return;
  }
  let html = await fs.readFile(filePath, 'utf8');
  // console.log('html:', html);
  const $ = cheerio.load(html);
  const table = $('table').filter((i, el) => {
    return $(el).find('thead').text().includes('每日收盤行情');
  });
  if (table.length === 0) {
    console.log('Table with thead containing "每日收盤行情" not found.');
    return;
  }
  const tbody = table.find('tbody');
  const rows = tbody.find('tr');

  let stockDaily = [];
  rows.each((i, row) => {
    const cells = $(row).find('td');
    const rowData = [];
    cells.each((j, cell) => {
      rowData.push($(cell).text().trim());
    });
    let stockCode = rowData[0];//證券代號
    let stockName = rowData[1];// 證券名稱
    let stockShares = rowData[2];  //成交股數 	
    let stockTransaction = rowData[3]; //成交筆數
    let stockAmount = rowData[4]; //成交金額
    let stockOpenPrice = rowData[5]; //開盤價
    let stockHighPrice = rowData[6]; //最高價
    let stockLowPrice = rowData[7]; //最低價
    let stockClosePrice = rowData[8]; //收盤價
    let stockChange = rowData[10]; //漲跌價差
    if (stockCode.startsWith('0')) {
      return;
    }
    let data = [
      stockCode,
      stockName,
    ];
    stockDaily.push(data);
  });
  // Log the first item of each item in stockDaily
  // stockDaily.forEach((item, index) => {
  //   console.log(`Item ${index + 1}: ${item[0]}, ${item[1]}`);
  // });

  // Write the stockDaily to a file
  const stockPriceFolder = '../A01_StockPrice';
  stockDaily.forEach(async (item) => {

    if (!/^\d+$/.test(item[0])) {
      console.log('Stock code is not a pure number:', item[0]);
      return; // Continue to the next iteration if item[0] is not a pure number
    }
    const stockName = item[1].replace(/\*/g, '');
    const fileName = `${item[0]}_${stockName}.json`;
    const filePath = path.join(stockPriceFolder, fileName);
    try {
      // Check if the file already exists
      await fs.access(filePath);
      console.log(`File already exists: ${filePath}`);
    } catch (err) {
      // If the file does not exist, create it
      if (err.code === 'ENOENT') {
        try {
          await fs.writeFile(filePath, "[]");
          console.log(`File written: ${filePath}`);
        } catch (writeErr) {
          console.error(`Error writing file ${filePath}:`, writeErr);
        }
      } else {
        console.error(`Error checking file ${filePath}:`, err);
      }
    }

  });
}
async function getRawDataList() {
  let files = [];
  let folderPath = "../A00_rawData";
  const fileNames = await fs.readdir(folderPath);
  for (const fileName of fileNames) {
    const filePath = path.join(folderPath, fileName);
    const stats = await fs.stat(filePath);
    files.push({ name: fileName, size: stats.size });
  }
  return files;
}
async function getArchivedList() {
  let files = [];
  let folderPath = "../A00_rawData/archived";
  const fileNames = await fs.readdir(folderPath);
  for (const fileName of fileNames) {
    const filePath = path.join(folderPath, fileName);
    const stats = await fs.stat(filePath);
    files.push({ name: fileName, size: stats.size });
  }
  return files;
}


main();