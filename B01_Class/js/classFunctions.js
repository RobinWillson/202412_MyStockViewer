const { raw } = require('express');
const { read } = require('fs');
const path = require('path');
const csv = require('csv-parser');
const fsSync = require('fs'); // Use the synchronous fs module for createReadStream
const fs = require('fs').promises;
const iconv = require('iconv-lite');


async function main() {
  const target = '../classInfo.json';
  let result;
  let data1;
  let data0 = require(target);
  //--------------------------------
  let raw11 = require('../raw1/20241210_產業分類_楊雲翔.json');
  let raw12 = require('../raw1/20241209_產業分類_楊雲翔.json');
  console.log('raw11Length:', Object.keys(raw11).length);
  console.log('raw12Length:', Object.keys(raw12).length);
  data1 = { ...raw11, ...raw12 };
  console.log("data1 length:", Object.keys(data1).length);
  //--------------------------------
  let raw2 = await readRaw2();
  console.log("raw2 length:", Object.keys(raw2).length);
  data1 = { ...data1, ...raw2 };
  console.log("data1 length:", Object.keys(data1).length);
  //--------------------------------
  // 比較data0和data1 ? 怎麼比..? 依實際使用狀況, 之後再更新
  //--------------------------------
  await fs.writeFile(target, JSON.stringify(data1));
  return;
}
async function readRaw2() {
  let files = await fs.readdir('../raw2');
  let result = {};

  for (const file of files) {
    let newData;
    let newKey = "raw2_" + file.replace("營收分析_", "").replace(".csv", "");
    result[newKey] = [];
    let filePath = path.join('../raw2', file);
    let data = await readCSVFile(filePath);

    for (let i = 1; i < data.length; i++) {
      let dataLv1 = data[i];
      Object.keys(dataLv1).forEach((key) => {
        if (key.includes("(")) {
          let match = dataLv1[key].match(/="([^"]+)\((\d+)\)"/);
          if (match) {
            newData = {
              name: match[1],
              code: match[2]
            };
            result[newKey].push(newData);
          }
        }
      });
    }
  }
  // console.log("result:", result);
  return result;
}
function readCSVFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fsSync.createReadStream(filePath)
      .pipe(iconv.decodeStream('big5')) // Change 'big5' to the correct encoding if needed
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

main();
// readRaw2();