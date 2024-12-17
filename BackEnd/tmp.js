function unifyDataLength(dataInput) {
  // dataInput :[{code:xxx, price:[arr5]} ]
  let allDate = new Set();
  dataInput.forEach(item => {
    item.price.forEach(data => {
      allDate.add(data[0]); // Add the date to the Set
    });
  });
  let sortedDates = Array.from(allDate).sort((a, b) => new Date(a) - new Date(b)); // Sort dates
  return sortedDates;
}
function fillMissingDates(data, sortedDates) {
  const dateMap = new Map(data.map((item) => [item[0], item]));
  return sortedDates.map(
    (date) => dateMap.get(date) || [date, null, null, null, null]
  );
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




function main() {
  let data1 = [
    {
      code: 'A',
      price: [
        ['2024-01-01', 1, 2, 3, 4],
        ['2024-01-03', 5, 6, 7, 8],
        ['2024-01-03', 5, 6, 7, 8],
        ['2024-02-10', 9, 10, 11, 12],
        ['2024-03-10', 9, 10, 11, 12],
      ]
    },
    {
      code: 'B',
      price: [
        ['2024-02-02', 13, 14, 15, 16],
        ['2024-02-04', 17, 18, 19, 20],
        ['2024-03-05', 21, 22, 23, 24]
      ]
    }
  ];

  let allDate = unifyDataLength(data1);
  console.log("data1[0].code", data1[0].code);
  console.log("data1[1].code", data1[1].code);
  let priceData1 = fillMissingDates(data1[0].price, allDate);
  let priceData2 = fillMissingDates(data1[1].price, allDate);
  // console.log("priceData1", priceData1);
  console.log("priceData2", priceData2);
  let filledData1 = fillFirstNull(priceData1);
  let filledData2First = fillFirstNull(priceData2);
  let filledData2Last = fillLastNull(filledData2First);
  let filledData2 = fillMiddleNull(filledData2Last);
  // console.log("filledData1", filledData1);
  console.log("filledData2First", filledData2First);
  console.log("filledData2Last", filledData2Last);
  console.log("filledData2", filledData2);
}
main();

function test() {
  let originalArray = [1, 2, 3];
  let referenceArray = originalArray;

  referenceArray[0] = 99;

  console.log(originalArray); // Output: [99, 2, 3]
}

// test();