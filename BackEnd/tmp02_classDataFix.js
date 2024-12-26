//替classInfo.json加上Order的

const fs = require('fs').promises;
async function main() {
  let fileData0 = await fs.readFile('../B01_Class/classInfo.json', 'utf8');
  fileData0 = JSON.parse(fileData0);
  // console.log(fileData0);
  let fileData1 = {};

  for (let key in fileData0) {
    let fileData2 = [];
    classInfo = fileData0[key];
    for (let j = 0; j < classInfo.length; j++) {
      let classData = classInfo[j];
      if (classData.hasOwnProperty('order')) {
        fileData2.push(classInfo);
      } else {
        classData.order = 9;
        fileData2.push(classData);
      }
    }
    fileData1[key] = fileData2;
  }
  console.log(fileData1);
  await fs.writeFile('../B01_Class/classInfo.json', JSON.stringify(fileData1, null, 2), 'utf8');
  return;

  console.log('Done');
}

main();