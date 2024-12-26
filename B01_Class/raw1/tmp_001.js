const fs = require('fs').promises;
async function main() {
  let file1 = './20241210a_產業分類_楊雲翔.json';
  let file2 = './20241210_產業分類_楊雲翔.json';
  // return;
  let data0 = await fs.readFile(file1, 'utf8');
  let jsonData = JSON.parse(data0);
  let renamedData = {};
  for (let key in jsonData) {
    if (RegExp('\\b' + "raw1_" + '\\b').test(key)) {
      console.log('raw2 key:', key);
      continue;
    }
    // --- do something here

    // ---------------------
  }
  console.log(renamedData);
  await fs.writeFile(file2, JSON.stringify(renamedData, null, 2), 'utf8');
}


main();