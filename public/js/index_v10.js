
let stockListArr = [];
let classListObj = {};
document.addEventListener("DOMContentLoaded", async function () {
  const stockListResponse = await fetch('/stock-list');
  stockListArr = await stockListResponse.json();
  // console.log('stockListArr:', stockListArr);
  //------
  const classListResponse = await fetch('/class-info');
  classListObj = await classListResponse.json();
  //------
  const classSelection = document.querySelector('#class-selection');
  for (const [key] of Object.entries(classListObj)) {
    const option = document.createElement('option');
    option.value = key;
    option.text = key;
    classSelection.add(option);
  }
});

document.getElementById('stock-code-search-btn').addEventListener('click', async function () {
  hideError();
  // 檢查是否有輸入股票代碼
  const stockCode = document.getElementById('stock-code-search').value;
  if (!stockCode) {
    displayError('Please enter a stock code.');
    return;
  }
  // 檢查股票代碼是否存在
  const stockFound = stockListArr.some(stock => stock.includes(stockCode));
  if (!stockFound) {
    displayError('Invalid stock code.');
    return;
  }
  // 檢查股票代碼屬於哪一個分類
  let newClassKey = [];
  for (const key in classListObj) {
    let Element = classListObj[key];
    Element.some(item => {
      if (item.code == stockCode) {
        newClassKey.push(key);
      }
    });
  }
  if (newClassKey.length === 0) {
    displayError('此股票代碼不屬於任何分類');
    return;
  }
  // render 分類下拉選單
  const classSelection = document.querySelector('#class-selection');
  classSelection.innerHTML = '';
  newClassKey.forEach(key => {
    const option = document.createElement('option');
    option.value = key;
    option.text = key;
    classSelection.add(option);
  });
});

document.getElementById('renderChartsBtn').addEventListener('click', async function () {
  hideError();
  renderChartsHandler();
  return;

  // -----------

  console.log('classList 001:', classList);
  for (let key in classList) {
    let stockCode = classList[key].code;
    if (!stockListArr.some(stock => stock.includes(stockCode))) {
      console.log(`${stockCode} not found in stock list.`);
      continue;
    }
    let res = await fetch(`/stockPrice/${classList[key].code}`);
    let result = await res.json() || [];
    console.log("key", classList[key].code);
    console.log(result.length);
    classList[key].data = result;
  }
  console.log('classList 002:', classList);
  return;
  Highcharts.chart('chart-1', {
    chart: {
      type: 'line',
      height: '100%'
    },
    title: {
      text: 'Stock Price History'
    },
    subtitle: {
      text: `Stock Code: ${stockCode}`
    },
    xAxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    },
    yAxis: {
      title: {
        text: 'Price (USD)'
      }
    },
    series: [{
      name: stockCode,
      data: [29.9, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6, 148.5, 216.4, 194.1, 95.6, 54.4] // Example data
    }]
  });
});

//--- Custom Function
async function renderChartsHandler() {
  let { stockCode, classKey } = await getInput();
  let checkInputResult = checkInput(stockCode, classKey);
  if (!checkInputResult) {
    alert('checkInputResult Fail');
    return;
  }
  let stockCodeListInClass = retrieveExistStockCodeList(classKey);
  let stockDataList = managerStockPriceData(stockCodeListInClass);

  // dataFilter(classKey);
  //-----
  async function getInput() {
    const stockCode = document.getElementById('stock-code-search').value;
    const classKey = document.querySelector('#class-selection').value;
    if (!stockCode) {
      displayError('Please enter a stock code.');
      return;
    }
    if (!classKey) {
      displayError('Please select a class.');
      return;
    }
    return { stockCode, classKey };
  }
  function checkInput(stockCode, classKey) {
    if (!stockListArr.some(stock => stock.includes(stockCode))) {
      displayError('股票代碼不存在於資料庫');
      return false;
    }
    console.log("股票代碼存在於資料庫");

    if (!classListObj[classKey]) {
      displayError('類號不存在於資料庫');
      return false;
    }
    console.log("類號存在於資料庫");

    let classList = classListObj[classKey];
    let check = classList.some(item => {
      return item.code == parseInt(stockCode);
    });
    if (!check) {
      displayError('股票代碼不存在於此類號');
      return false;
    }
    console.log("股票代碼存在於此類號");
    //----
    return true;

  }
  function retrieveExistStockCodeList(classKey) {
    let classList = classListObj[classKey];
    console.log('classList 001:', classList);
    let stockCodeListInClass = [];
    classList.forEach(item => {
      let checkStockCode = stockListArr.some(stock =>
        stock.includes(item.code)
      );
      if (checkStockCode) {
        stockCodeListInClass.push(item.code);
      }
    });
    return stockCodeListInClass;
  }
  async function managerStockPriceData(stockCodeListInClass) {
    let result = [];
    stockCodeListInClass.forEach(async stockCode => {
      let resultItem = { code: "", price: [] };
      resultItem.code = stockCode;
      resultItem.price = retrievePrice(stockCode);
      result.push(resultItem);
      console.log("resultItem", resultItem);
    });

    async function retrievePrice(stockCode) {
      let response = await fetch(`http://localhost:3000/stockPrice/${stockCode}`);
      const data0 = await response.json();
      let data1 = data0.map((item) => {
        const timestamp = new Date(item[0]).getTime();
        const values = item.slice(1, 5).map(Number);
        return [timestamp, ...values];
      });
      return data1;
    }

    function unifyDataLength(dataInput) {
      //dataInput :[{code:xxx, price:[arr5]} ]
      let allDate = [];
      dataInput.forEach(item => {
        allDate = allDate.concat(item.price.map(data => data[0]));
      });
      return allDate;
    }

    function fillNullValues(data) {
      // Find the first non-null data
      let firstNonNull = data.find((item) =>
        item.slice(1).some((value) => value !== null)
      );
      let lastNonNull = [...data]
        .reverse()
        .find((item) => item.slice(1).some((value) => value !== null));

      // Fill null values at the beginning with the first non-null data
      let filledData = [];
      let filling = true;
      for (let item of data) {
        if (filling && item.slice(1).every((value) => value === null)) {
          filledData.push([
            item[0],
            firstNonNull[1],
            firstNonNull[1],
            firstNonNull[1],
            firstNonNull[1],
          ]);
        } else {
          filling = false;
          filledData.push(item);
        }
      }

      // Fill null values at the end with the last non-null data
      filledData = filledData.reverse();
      filling = true;
      for (let i = 0; i < filledData.length; i++) {
        let item = filledData[i];
        if (filling && item.slice(1).every((value) => value === null)) {
          filledData[i] = [
            item[0],
            lastNonNull[4],
            lastNonNull[4],
            lastNonNull[4],
            lastNonNull[4],
          ];
        } else {
          filling = false;
        }
      }
      filledData = filledData.reverse();

      // Fill null values in the middle with the nearest earlier non-null value
      for (let i = 1; i < filledData.length; i++) {
        let item = filledData[i];
        if (item.slice(1).every((value) => value === null)) {
          let j = i - 1;
          while (
            j >= 0 &&
            filledData[j].slice(1).every((value) => value === null)
          ) {
            j--;
          }
          let prevItem = filledData[j];
          filledData[i] = [
            item[0],
            prevItem[4],
            prevItem[4],
            prevItem[4],
            prevItem[4],
          ];
        }
      }

      return filledData;
    }

  }

}

//--- Common Function
function displayError(message) {
  const warningDiv = document.querySelector('#warning');
  const warningMessage = document.querySelector('#warning-message');
  if (warningDiv && warningMessage) {
    warningMessage.innerText = message;
    warningDiv.hidden = false;
  } else {
    console.error('Element with ID "warning" or "warning-message" not found.');
  }
}

function hideError() {
  const warningDiv = document.querySelector('#warning');
  if (warningDiv) {
    warningDiv.hidden = true;
  } else {
    console.error('Element with ID "warning" not found.');
  }
}