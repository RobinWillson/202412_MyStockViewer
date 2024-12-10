/**
 * retrieve price from api
 * https://openapi.twse.com.tw/
 * 台灣證券交易所的API
 * https://www.twse.com.tw/exchangeReport/STOCK_DAY?&date=20241101&stockNo=2330
 * 它會取得11月整月份的價格
 * https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL
 * 它會取得當天所有股票的開高收低
 */

const fs = require('fs').promises;
const path = require('path');
// use [npm root -g] to get the global node_modules path
const globalNodeModulesPath = 'C:/Users/9910008/AppData/Roaming/npm/node_modules';

async function main() {
  let stockPriceFolder = '../A01_stockPrice_test';
  const stockPriceFiles = await fs.readdir(stockPriceFolder);
  for (const fileName of stockPriceFiles) {
    let filePath = path.join(stockPriceFolder, fileName);
    let fileNameArr = fileName.split('_');
    let stockCode = fileNameArr[0];
    let priceData = await retrieveFileData(filePath);
    let { earliestDate, latestDate } = priceDataRange(priceData);
    console.log('priceData.length :', priceData.length);
    console.log('earliestDate :', earliestDate);
    console.log('latestDate :', latestDate);
    let data = await priceRetrieve(stockCode, earliestDate, latestDate);
    console.log('data:', data);
    return;
  }
}

async function retrieveFileData(filePath) {
  // let stockPriceFolder = '../A01_stockPrice';
  // const stockPriceFiles = await fs.readdir(stockPriceFolder);
  // const fileName = stockPriceFiles.find(file => file.includes(stockCode));
  // let filePath = path.join(stockPriceFolder, fileName);
  // console.log('fileName:', filePath);
  let priceData = await fs.readFile(filePath, 'utf8');
  priceData = JSON.parse(priceData);
  return priceData;
}
function priceDataRange(priceData) {
  if (!Array.isArray(priceData) || priceData.length === 0) {
    return { startDate: false, endDate: false };
  }
  let earliestDate = Array.isArray(priceData[0]) && priceData[0].length > 0 ? priceData[0][0] : false;
  let latestDate = Array.isArray(priceData[priceData.length - 1]) && priceData[priceData.length - 1].length > 0 ? priceData[priceData.length - 1][0] : false;
  return { earliestDate, latestDate };
}

async function priceRetrieve(stockCode, earliestDate, latestDate) {
  let result = [];
  let range1 = [];
  let range2 = [];
  let retrieveEarliestDate = "2024-01-01";
  //======
  if (!earliestDate || !latestDate) {
    let rng1_EarliestDate = retrieveEarliestDate;
    let rng1_LatestDate = new Date().toLocaleDateString('en-CA');
    range1 = [rng1_EarliestDate, rng1_LatestDate];
  } else {
    let rng1_LatestDate = new Date().toLocaleDateString('en-CA');
    let rng1_EarliestDate = new Date(latestDate).toLocaleDateString('en-CA');
    range1 = [rng1_EarliestDate, rng1_LatestDate];
    if (new Date(earliestDate) <= new Date(retrieveEarliestDate)) {
      range2 = [];
    } else {
      let rng2_LatestDate = new Date(earliestDate).toLocaleDateString('en-CA');
      let rng2_EarliestDate = retrieveEarliestDate;
      range2 = [rng2_EarliestDate, rng2_LatestDate];
    }
  }
  //======
  if (range1.length > 0) {
    let data = await dataFetch(stockCode, range1[0], range1[1]);
    result.push(data);
  }
  if (range2.length > 0) {
    let data = await dataFetch(stockCode, range2[0], range2[1]);
    result.push(data);
  }
  return;
  //======

}
async function dataFetch(stockCode, startDate, endDate) {
  let result = [];
  const fetchStartDate = new Date(startDate);
  let fetchDate = new Date(endDate);
  while (fetchDate >= fetchStartDate) {
    const month = (fetchDate.getMonth() + 1).toString().padStart(2, '0');
    const year = fetchDate.getFullYear();
    let response;
    try {
      let url = `https://www.twse.com.tw/exchangeReport/STOCK_DAY?&date=${year}${month}01&stockNo=${stockCode}`;
      response = await fetch(url);
    } catch (e) {
      console.log('Error:', e);
      break;
    }
    let rawData = await response.json();
    rawData = rawData.data;
    for (let i = 0; i < rawData.length; i++) {
      rawData[i][0] = dateTranslate(rawData[i][0]);
      // let fields= [
      //   "0.日期",
      //   "1.成交股數",
      //   "2.成交金額",
      //   "3.開盤價",
      //   "4.最高價",
      //   "5.最低價",
      //   "6.收盤價",
      //   "7.漲跌價差",
      //   "8.成交筆數"
      // ],
      let date = dateTranslate(rawData[i][0]);
      let tradeShares = rawData[i][1].replace(/,/g, '');
      let tradeValue = rawData[i][2].replace(/,/g, '');
      let tradeCount = rawData[i][8].replace(/,/g, '');
      let openPrice = rawData[i][3];
      let highPrice = rawData[i][4];
      let lowPrice = rawData[i][5];
      let closePrice = rawData[i][6];

      let newData = [
        date,
        openPrice,
        highPrice,
        lowPrice,
        closePrice,
        tradeValue,
        tradeShares,
        tradeCount,
      ];
      result.push(newData);
    }
    fetchDate.setDate(fetchDate.getDate() - 30);
  }
  return result;
}

function dateTranslate(date) {
  //input date format: 110/01/01
  let [year, month, day] = date.split('/');
  year = (parseInt(year) + 1911).toString();
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}
function rawDataDateTranslate(rawData) {
  const translatedData = rawData.map(item => {
    let [year, month, day] = item[0].split('/');
    year = (parseInt(year) + 1911).toString();
    const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    item[0] = formattedDate;
    return item;
  });
  return translatedData;
}

main();
// priceRetrieve('2330');