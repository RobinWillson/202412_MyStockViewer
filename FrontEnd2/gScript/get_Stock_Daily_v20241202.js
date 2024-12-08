/**
 * 抓取全部股票的每日收盤價
 * 格式為html檔,需以JS進行分析
 * https://dop.gov.taipei/cp.aspx?n=EFE42F770DFD63FB
 * https://www.twse.com.tw/zh/trading/historical/mi-index.html
 * https://www.twse.com.tw/zh/trading/holiday.html
 * 
 * 2024/12/04
 * 抓取這個太容易失敗了, 放棄
 */
function A00_Get_Stock_Daily_History() {
  var scriptProperties = PropertiesService.getScriptProperties();
  var startDate = new Date('2024-11-25');
  var endDate = new Date('2010-12-31');
  var currentDate = new Date(scriptProperties.getProperty('currentDate') || '2024-11-29');
  if (currentDate > startDate) { currentDate = startDate; }

  if (currentDate < endDate) {
    Logger.log('All data fetched.');
    return;
  }

  let count = 0;
  while (count < 5) {
    // for (var i = 0; i < 5; i++) {
    if (currentDate < endDate) {
      Logger.log('All data fetched.');
      return;
    }

    currentDate.setDate(currentDate.getDate() - 1);
    scriptProperties.setProperty('currentDate', currentDate.toISOString().split('T')[0]);

    let fetchResult = fetchStockData(currentDate);
    if (fetchResult == false) {
      continue;
    }
    count++;
    // Sleep for 10+ seconds between each fetch
    Utilities.sleep(30234);
    // }
  }
}
function A01_resetGetStockDailyHistory() {
  var scriptProperties = PropertiesService.getScriptProperties();
  var today = new Date();
  today.setDate(today.getDate() - 1);
  scriptProperties.setProperty('currentDate', today.toISOString().split('T')[0]);
  Logger.log('currentDate reset to: ' + today.toISOString().split('T')[0]);
}

function B00_createTrigger() {
  ScriptApp.newTrigger('Get_Stock_Daily_History')
    .timeBased()
    .everyMinutes(15)
    .create();
}

function B01_deleteTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() == 'Get_Stock_Daily_History') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}





function sendLineNotify(message, token) {
  var options =
  {
    "method": "post",
    "payload": { "message": message },
    "headers": { "Authorization": "Bearer " + token }
  };
  UrlFetchApp.fetch("https://notify-api.line.me/api/notify", options);
}

function fetchStockData(date) {
  // stockHoliday={
  //   "20120802": "颱風/天災",
  //   "20130821": "颱風/天災",
  //   ....
  // }
  var todayStr = Utilities.formatDate(date, "GMT+8:00", "yyyyMMdd");
  // Logger.log("todayStr = " + todayStr + " // " + date.getDay());

  var folder = DriveApp.getFoldersByName('証交所每日收盤行情').next();
  var fileName = todayStr + "_StockDaily.html";

  // Check if the file already exists
  var files = folder.getFilesByName(fileName);
  if (files.hasNext()) {
    var existingFile = files.next();
    if (existingFile.getSize() > 1 * 1024 * 1024) {
      // Logger.log("File already exists and is larger than 1MB: " + fileName);
      return false;
    } else {
      // Check if the date is Saturday or Sunday
      var dayOfWeek = date.getDay();
      if (dayOfWeek === 6 || dayOfWeek === 0) {
        return false;
      }
      if (stockHoliday.hasOwnProperty(todayStr)) {
        Logger.log(todayStr + " : " + stockHoliday[todayStr]);
        return false;
      }
      // go and fetch the file
      Logger.log("File already exists but is less than 1MB, re-fetching: " + fileName);
      existingFile.setTrashed(true); // Move the existing file to trash
    }
  }

  // start fetching
  // var targetURL = "http://www.twse.com.tw/exchangeReport/MI_INDEX?response=html&date=" + todayStr + "&type=ALLBUT0999";
  var targetURL = "https://www.twse.com.tw/rwd/zh/afterTrading/MI_INDEX?response=html&type=ALLBUT0999&date=" + todayStr;
  Logger.log("targetURL=" + targetURL);

  var options = {
    'muteHttpExceptions': true,
    'followRedirects': true,
    'timeout': 30000 // Set timeout to 30 seconds
  };

  var response = UrlFetchApp.fetch(targetURL, options);
  var fileBlob = response.getBlob();
  fileBlob.setName(fileName);
  var result = folder.createFile(fileBlob);
  var fileSizeInBytes = fileBlob.getBytes().length;
  var fileSizeInMB = fileSizeInBytes / (1024 * 1024);
  Logger.log("Downloaded file size: " + fileSizeInMB.toFixed(1) + " MB");


  // Open 00_log.txt and write the log string at the first line
  // var logFiles = folder.getFilesByName('00_log.txt');
  // let logFile;
  // if (logFiles.hasNext()) {
  //   logFile = logFiles.next();
  // } else {
  //   logFile = folder.createFile('00_log.txt', '');
  // }
  // var logContent = logFile.getBlob().getDataAsString();
  // let logString = todayStr + " " + result.getName() + " " + fileSizeInMB.toFixed(1) + "MB\n";
  // logFile.setContent(logString + logContent);

  return result;
}

function getHoliday() {
  var folder = DriveApp.getFoldersByName('証交所每日收盤行情').next();
  var fileName = '01_holiday.json';
  var files = folder.getFilesByName(fileName);
  if (files.hasNext()) {
    var file = files.next();
    var fileContent = file.getBlob().getDataAsString();
    return JSON.parse(fileContent);
  }
  return [];
}

function setHoliday(holiday) {
  var folder = DriveApp.getFoldersByName('証交所每日收盤行情').next();
  var fileName = '01_holiday.json';
  var file = folder.createFile(fileName, JSON.stringify(holiday));
  return file;
}

function useHolidayData() {
  Logger.log(stockHoliday["20160916"]);
}
