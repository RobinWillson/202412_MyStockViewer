function fillFirstNull(data) {
  // Create a copy of the data to avoid modifying the original array
  console.log("fillFirstNull data", data);
  let dataCopy = data.map(item => [...item]);

  // Find the first non-null data
  let firstNonNull = dataCopy.find((item) =>
    item.slice(1).some((value) => value !== null)
  );
  console.log("firstNonNull", firstNonNull);

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

// Example usage
let stockDataList = [
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

// let unifiedDate = unifyDataLength(stockDataList);
// console.log("unifiedDate", unifiedDate);

// // fill empty data in stockDataList
// let filledDataWithNull = fillEmptyDataWithNull(stockDataList, unifiedDate);
// console.log("filledDataWithNull", filledDataWithNull);

let filledFirstNullList = fillFirstNull(stockDataList);
console.log("filledFirstNullList", filledFirstNullList);