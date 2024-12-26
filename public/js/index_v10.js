let stockListArr = [];
let classListObj = {};
let chartArr = [];


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
  await clearCharts();
  chartArr = [];
  await renderChartsHandler();
  return;

  // -----------
});

//--- Custom Function
async function renderChartsHandler() {
  //----------------
  let { stockCode, classKey } = await getInput();
  let checkInputResult = checkInput(stockCode, classKey);
  if (!checkInputResult) {
    alert('checkInputResult Fail');
    return;
  }
  //----------------
  const classListResponse = await fetch('/class-info');
  classListObj = await classListResponse.json();
  //--------
  let stockCodeListInClass = retrieveExistStockCodeList(classKey);
  console.log("stockCodeListInClass", stockCodeListInClass);
  console.log("classListObj", classListObj[classKey]);

  // retrieve stockPrice from stockCodeListInClass
  let stockDataList = await managerStockPriceData(stockCodeListInClass, classKey);
  console.log("stockDataList", stockDataList);

  // Remove all existing Highcharts
  // Highcharts.charts.forEach((chart) => chart.destroy());
  // if (chartArr && chartArr.length > 0) {
  //   console.log("chartArr", chartArr);
  //   chartArr.forEach(chart => chart.destroy());
  //   chartArr = [];
  // }
  // let chartElements = document.querySelectorAll('.chartCustom');
  // chartElements.forEach((element) => {
  //   element.innerHTML = "";
  // });
  chartArr = [];

  // render charts
  await renderChart0(stockDataList);
  await renderCharts(stockDataList);
  await chartsSync(chartArr);
  console.log("chart Render Done");
  //==== functions ====
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
    let stockCodeListInClass = [];
    let errorList = [];

    // check if order property exists, if not, set it to 9
    classList.forEach((item) => {
      if (!item.hasOwnProperty('order')) {
        item.order = 9;
      } else {
        item.order = parseInt(item.order);
      }
      console.log(item.code, item.name, item.order);
    });

    // sort classList by order
    classList.sort((a, b) => {
      return a.order - b.order;
    });

    // check if stock code exists in the stock list
    classList.forEach(item => {
      let checkStockCode = stockListArr.some(stock =>
        stock.includes(item.code)
      );
      if (checkStockCode) {
        stockCodeListInClass.push(item.code);
      } else {
        let str = `${item.name}(${item.code})`;
        errorList.push(str);
      }
    });
    if (errorList.length > 0) {
      let errorMessage = errorList.join(', ');
      displayError(`以下股票代碼不存在於資料庫: ${errorMessage}`);
    }

    return stockCodeListInClass;
  }
  async function managerStockPriceData(stockCodeListInClass, classKey) {

    let stockDataList = [];
    for (let stockCode of stockCodeListInClass) {
      let resultItem = { code: "", price: [] };
      resultItem.code = stockCode;
      resultItem.name = retrieveName(stockCode);
      resultItem.price = await retrievePrice(stockCode);
      resultItem.Order = classListObj[classKey].find(item => item.code == stockCode).order;
      stockDataList.push(resultItem);
    }
    // get longest date length from stockDataList, return Dates Array
    let filledStockDataList = [];
    let unifiedDate = unifyDataLength(stockDataList);
    for (let i = 0; i < stockDataList.length; i++) {
      let stock = stockDataList[i];
      // console.log("fill Data : ", stock.code);
      let fillMissingDatesByNull = fillMissingDates(stock, unifiedDate);
      // console.log("fillMissingDatesByNull", fillMissingDatesByNull);
      let filledFirstNullList = fillFirstNull(fillMissingDatesByNull);
      // console.log("filledFirstNullList", filledFirstNullList);
      let fillLastNullList = fillLastNull(filledFirstNullList);
      // console.log("fillLastNullList", fillLastNullList);
      let filledData = fillMiddleNull(fillLastNullList);
      // console.log("filledData", filledData);
      stock.price = filledData;
      filledStockDataList.push(stock);
    }
    return filledStockDataList;
    //=== Functions
    function fillMissingDates(stock, sortedDates) {
      let priceData = stock.price;
      let code = stock.code;
      const dateMap = new Map(priceData.map((item) => [item[0], item]));
      return sortedDates.map((date) => {
        if (!dateMap.has(date)) {
          console.log(`Missing date found for stock ${code}: ${date}`);
        }
        return dateMap.get(date) || [date, null, null, null, null];
      });
    }
    function fillFirstNull(data) {
      // Create a copy of the data to avoid modifying the original array
      let dataCopy = data.map(item => [...item]);

      // Find the first non-null data
      let firstNonNull = dataCopy.find((item) =>
        item.slice(1).some((value) => value !== null)
      );

      // Fill null values at the beginning with the first non-null data
      for (let i = 0; i < dataCopy.length; i++) {
        if (dataCopy[i].slice(1).every((value) => value === null)) {
          dataCopy[i] = [...firstNonNull];
        } else {
          break;
        }
      }

      return dataCopy;
    }
    function fillLastNull(data) {
      // Find the last non-null data
      let dataCopy = data.map(item => [...item]);

      let lastNonNull = [...dataCopy]
        .reverse()
        .find((item) => item.slice(1).some((value) => value !== null));

      // Fill null values at the beginning with the first non-null data
      let filledData = [];
      let filling = true;
      // Fill null values at the end with the last non-null data
      filledData = dataCopy.reverse();
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
      return filledData;
    }
    function fillMiddleNull(data) {
      // Find the last non-null data
      let dataCopy = data.map(item => [...item]);
      let filledData = [];
      filledData = dataCopy;
      for (let i = 0; i < filledData.length; i++) {
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
    function retrieveName(stockCode) {
      let result;
      let test = stockListArr.some(stock => {
        if (stock.includes(stockCode)) {
          stock = stock.replace('.json', ' ');
          result = stock.split('_')[1];
          return true;
        }
      });
      if (test) {
        return result;
      } else {
        return false;
      }
    }
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
      // dataInput :[{code:xxx, price:[arr5]} ]
      let allDate = new Set();
      for (let item of dataInput) {
        for (let data of item.price) {
          allDate.add(data[0]); // Add the date to the Set
        }
      }
      let sortedDates = Array.from(allDate).sort((a, b) => new Date(a) - new Date(b)); // Sort dates
      return sortedDates;
    }
  }
  async function renderChart0(stockDataList) {
    let stock = stockDataList[0];
    let stockCode = stock.code;
    let stockName = stock.name;
    let stockPrice = stock.price;
    let chartId = `chart-0`; // Removed the '#' from the chartId
    let chartTitle = `Stock Price History: ${stockName} (${stockCode})[${stock.Order}]`;
    let chartData = stockPrice;
    let chart = document.getElementById(chartId); // Correctly select the chart element
    let chartElement = await renderChart01(chartId, chartTitle, chartData);
    chartArr.push(chartElement);

    function renderChart01(chartId, chartTitle, chartData) {
      const chartElement = Highcharts.stockChart(chartId, {
        chart: {
          height: chartId === 'chart-0' ? 70 : null, // Set height for chart-0
        },
        rangeSelector: {
          selected: 1,
          enabled: false, // Disable the range selector for this chart
        },
        navigator: {
          enabled: true, // Disable the navigator for this chart
          height: 20, // Set height for the navigator
        },
        scrollbar: {
          enabled: true, // Disable the scrollbar for this chart
        },
        xAxis: {
          events: {
            setExtremes: syncExtremes,
          },
          visible: false,
          min: chartData[0][0],
          max: chartData[chartData.length - 1][0],
        },
        series: [
          {
            type: "candlestick",
            data: chartData,
            visible: false,
            dataGrouping: {
              forced: true, // Force the data grouping
              units: [
                ["day", [1]],
                ["week", [1]],
                ["month", [1, 2, 3, 4, 6]],
              ],
            },
          },
        ],
        exporting: {
          enabled: false // Disable the exporting menu
        }
      });
      // Hide the background elements
      chartElement.container.querySelector('.highcharts-background').style.display = 'none';
      chartElement.container.querySelector('.highcharts-plot-background').style.display = 'none';
      // Set the number of points to show

      if (chartElement && chartElement.xAxis && chartElement.xAxis[0]) {

        const numberOfPointsToShow = 100;
        const minIndex = Math.max(chartData.length - numberOfPointsToShow, 0);
        const maxIndex = chartData.length - 1;
        chartElement.xAxis[0].setExtremes(
          chartData[minIndex][0],
          chartData[maxIndex][0],
          true,
          false
        );
        console.log("setExtremes executed successfully");
      } else {
        console.error(`Chart element for ${chartId} is not defined or missing xAxis.`);
      }


      return chartElement;
    }
  }
  async function renderCharts(stockDataList) {
    for (let i = 0; i < stockDataList.length; i++) {
      let stock = stockDataList[i];
      let chartId = `chart-${i + 1}`; // Removed the '#' from the chartId
      let chartTitle = `${stock.name} (${stock.code})[${stock.Order}]`;
      let chartData = stock.price;
      // let chart = document.getElementById(chartId); // Correctly select the chart element
      let chartElement = await renderChart(chartId, chartTitle, chartData);
      if (chartElement && chartElement.xAxis && chartElement.xAxis[0]) {
        const numberOfPointsToShow = 100;
        const minIndex = Math.max(chartData.length - numberOfPointsToShow, 0);
        const maxIndex = chartData.length - 1;
        chartElement.xAxis[0].setExtremes(
          chartData[minIndex][0],
          chartData[maxIndex][0],
          true,
          false
        );
      }
      chartArr.push(chartElement);
    }
    //--------
    function renderChart(chartId, chartTitle, chartData) {
      const chartElement = Highcharts.stockChart(chartId, {
        rangeSelector: {
          selected: 1,
          enabled: false, // Disable the range selector for this chart
        },
        title: {
          text: chartTitle
        },
        navigator: {
          enabled: false, // Disable the navigator for this chart
        },
        scrollbar: {
          enabled: true, // Disable the scrollbar for this chart
        },
        xAxis: {
          events: {
            setExtremes: syncExtremes,
          },
          min: chartData[0][0],
          max: chartData[chartData.length - 1][0],
        },
        series: [
          {
            type: "candlestick",
            data: chartData,
            stickyTracking: false,
            dataGrouping: {
              forced: true, // Force the data grouping
              units: [
                ["day", [1]],
                ["week", [1]],
                ["month", [1, 2, 3, 4, 6]],
              ],
            },
          },
        ],
        exporting: {
          buttons: {
            contextButton: {
              menuItems: [
                'viewFullscreen',
                'downloadJPEG',
                {
                  text: '筆記',
                  onclick: async function () {
                    await personalNote(chartTitle);
                  }
                }
              ]
            }
          }
        }
      });
      return chartElement;
    }
  }
  async function personalNote(chartTitle) {
    let tmp = chartTitle.match(/\((\d+)\)/);
    let stockCode = tmp[1];
    let tmp2 = chartTitle.match(/\[(\d+)\]/);
    let stockOrder;


    // Create the popup window
    let popup = document.createElement('div');
    popup.className = 'card';
    popup.style.position = 'fixed';
    popup.style.left = '50%';
    popup.style.top = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.padding = '20px';
    popup.style.backgroundColor = 'white';
    popup.style.zIndex = '1000';
    popup.style.boxShadow = '0 0 5px cyan,0 0 25px cyan';
    // popup.style.display = 'flex';
    // popup.style.flexDirection = 'column';

    // Create a title
    let title = document.createElement('h4');
    title.innerText = `${chartTitle}`;
    popup.appendChild(title);

    //Create Order Setting Box
    let orderSettingBox = document.createElement('div');
    orderSettingBox.className = 'row';
    popup.appendChild(orderSettingBox);

    // Create the input box
    let inputGroup = document.createElement('div');
    inputGroup.className = 'input-group input-group-sm mb-2';
    orderSettingBox.appendChild(inputGroup);

    let inputBoxOrderSetting = document.createElement('input');
    inputBoxOrderSetting.className = 'form-control';
    inputBoxOrderSetting.id = 'orderSetting';
    inputBoxOrderSetting.type = 'number';
    inputBoxOrderSetting.placeholder = "enter to order";
    inputGroup.appendChild(inputBoxOrderSetting);

    // Create the submit button
    let submitButton = document.createElement('button');
    submitButton.className = 'btn btn-outline-secondary';
    submitButton.id = "submitOrderSetting";
    submitButton.innerText = 'Submit';
    submitButton.onclick = async function () {
      await submitOrderSettingHandler(stockCode);
      let note = inputBoxOrderSetting.value;
      console.log(`Note for stock ${stockCode}: ${note}`);
      document.body.removeChild(popup);
    };
    inputGroup.appendChild(submitButton);

    // create button row
    let buttonRow = document.createElement('div');
    buttonRow.className = 'd-flex justify-content-between';
    popup.appendChild(buttonRow);

    // Create the cancel button
    let cancelButton = document.createElement('button');
    cancelButton.innerText = 'Cancel';
    cancelButton.onclick = function () {
      document.body.removeChild(popup);
    };
    buttonRow.appendChild(cancelButton);

    // Append the popup to the body
    document.body.appendChild(popup);
  }
  async function chartsSync(chartArr) {
    for (let i = 0; i < chartArr.length; i++) {
      let newChartArr = [];
      let chart = chartArr[i];
      if (chart.renderTo.id === "chart-0") {
        continue; // Skip the chart with container "chart-0"
      }
      let charts = chartArr.filter((c) => c !== chart && c.renderTo.id !== "chart-0");
      newChartArr = [chart, ...charts];
      syncTooltip(chart.container, newChartArr);
    }
  }

  async function submitOrderSettingHandler(stockCode) {
    let className = document.querySelector('#class-selection').value;
    let classData = classListObj[className];
    let stockData = classData.filter((item) => item.code == stockCode);
    stockData = stockData[0];
    let orderSetting = document.querySelector('#orderSetting').value;
    stockData.order = orderSetting;
    //-------------
    let index = classData.findIndex((item) => item.code == stockCode);
    classData[index] = stockData;
    classListObj[className] = classData;
    //-------------
    try {
      let response = await fetch('/update-class-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(classListObj)
      });
      if (response.ok) {
        console.log('classInfo.json updated.');

      } else {
        console.error('Failed to update classInfo.json');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }


}
Highcharts.Pointer.prototype.reset = function () {
  return undefined;
};

function syncExtremes(e) {
  let thisChart = this.chart;
  if (e.trigger !== "syncExtremes") {
    // let theCharts = Highcharts.charts;
    // console.log("theCharts", theCharts);
    Highcharts.charts.forEach(function (chart) {
      if (chart !== thisChart) {
        if (chart.xAxis[0].setExtremes) {
          chart.xAxis[0].setExtremes(e.min, e.max, undefined, false, {
            trigger: "syncExtremes",
          });
        }
      }
    });
  }
}

function syncTooltip(container, charts) {
  container.addEventListener("click", function (e) {
    var event, chart, i, xAxisValue;

    // Normalize the event to get the x-axis value (date)
    charts[0].pointer.reset = function () { return undefined; };
    event = charts[0].pointer.normalize(e);
    xAxisValue = charts[0].xAxis[0].toValue(event.chartX);
    // Round xAxisValue to the start of the day (midnight)
    var date = new Date(xAxisValue);
    date.setHours(0, 0, 0, 0);
    xAxisValue = date.getTime();
    for (i = 0; i < charts.length; i++) {
      chart = charts[i];
      event = chart.pointer.normalize(e);
      // Find the closest point in the series based on the x-axis value (date)
      // console.log("chart.renderTo.id", chart.renderTo.id);
      var point = chart.series[0].points.reduce((closest, p) => {
        return Math.abs(p.x - xAxisValue) <
          Math.abs(closest.x - xAxisValue)
          ? p
          : closest;
      }, chart.series[0].points[0]);
      // console.log("point", Boolean(point));
      // console.log("point value", Math.abs(point.x - xAxisValue) < (24 * 3600 * 1000));
      // if (point && Math.abs(point.x - xAxisValue) < 24 * 3600 * 1000) {
      if (point && Math.abs(point.x - xAxisValue)) {
        // Ensure the point is within the same day
        point.highlight(e);
      }
    }
  });
}
Highcharts.Point.prototype.highlight = function (event) {
  // this.setState('select');
  // this.select('false');
  // this.onMouseOut();
  this.onMouseOver();
  this.series.chart.xAxis[0].drawCrosshair(event, this); // Draw the crosshair
  this.series.chart.tooltip.hide(); // Hide the tooltip
};

async function clearCharts() {
  Highcharts.charts.forEach((chart) => {
    if (chart) {
      chart.destroy();
    }
  });
  Highcharts.charts.length = 0;
}
//--- Common Function
function displayError(message) {
  const warningDiv = document.querySelector('#warning');
  const warningMessage = document.querySelector('#warning-message');
  if (warningDiv && warningMessage) {
    warningMessage.innerText = message;
    warningDiv.hidden = false;
    warningDiv.style.padding = '0.1rem 1rem';
    warningDiv.style.fontSize = 'small';
    const closeBtn = document.querySelector('.alert-dismissible .btn-close');
    closeBtn.style.padding = '0.25rem';
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