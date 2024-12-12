
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
  // -----------
  let classList = classListObj[classKey];

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