
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
  const stockCode = document.getElementById('stock-code-search').value;
  if (!stockCode) {
    displayError('Please enter a stock code.');
    return;
  }
  const stockFound = stockListArr.some(stock => stock.includes(stockCode));
  if (!stockFound) {
    displayError('Invalid stock code.');
    return;
  } else {
    console.log('stockFound:', stockFound);
    displayError('stockFound' + stockFound);

  }
});



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