//A01_StockPrice 這裡的股價價格含有逗點,造成後續計算錯誤
//這個檔案暫時修正現有的問題

const fs = require('fs').promises;
async function main() {
  let folderPath = '../A01_stockPrice';
  let files = await fs.readdir(folderPath);
  for (let i = 0; i < files.length; i++) {
    let file = files[i];
    let filePath = `${folderPath}/${files[i]}`;
    let fileData0 = await fs.readFile(filePath, 'utf8');
    fileData0 = JSON.parse(fileData0);
    for (let j = 0; j < fileData0.length; j++) {
      let item = fileData0[j];
      for (let k = 1; k < item.length; k++) {
        if (typeof item[k] === 'string') {
          item[k] = parseFloat(item[k].replace(/,/g, ''));
        }
      }
    }
    await fs.writeFile(filePath, JSON.stringify(fileData0));
  }
  console.log('Done');
}

main();