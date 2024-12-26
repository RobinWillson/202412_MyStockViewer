/**
 * 抓取 html每日收盤行情資料, 太容易失敗
 * 檢查是否有失敗的資料太麻煩
 * 改用02_retrievePrice.js
 * 這個檔案可以將每日收盤行情資料轉換成個股檔案
 * 例如 0050_元大台灣50.json
 * 只要讀取一個html檔案, 就可以轉換成多個個股檔案
 * 每個月要跑一次, 以免有的股票休息, 沒抓到資料
 */
// const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');
// const cheerio = require('cheerio');

let fetch;
let cheerio;

async function main_V2() {
  fetch = (await import('node-fetch')).default;
  cheerio = (await import('cheerio'));
  // console.log(cheerio);
  let html = await stockListFetch('2024-12-19');
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
  // console.log('stockDaily:', stockDaily);//debug

  //== Write the stockDaily to a file
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
      // console.log(`File already exists: ${filePath}`);
    } catch (err) {
      // If the file does not exist, create it
      if (err.code === 'ENOENT') {
        try {
          await fs.writeFile(filePath, "[]");
          console.log(`新檔案創立: ${filePath}`);
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

async function stockListFetch(targetDate) {

  let result = [];
  let fetchDate = new Date(targetDate);
  const month = (fetchDate.getMonth() + 1).toString().padStart(2, '0');
  const year = fetchDate.getFullYear();
  const day = fetchDate.getDate().toString().padStart(2, '0');
  const todayStr = `${year}${month}${day}`;
  console.log('stockListFetch triggered.');
  let response;
  let url = "https://www.twse.com.tw/rwd/zh/afterTrading/MI_INDEX?response=html&type=ALLBUT0999&date=" + todayStr;
  try {
    console.log('fetch url:', url);
    response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const html = await response.text();
    return html;
  } catch (e) {
    console.log('Error:', e);
    throw error;
    return false;
  }
  if (response.status !== 200) {
    console.log('response.status:', response.status);
    return false;
  }

}


main_V2();