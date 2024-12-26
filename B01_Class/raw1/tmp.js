let classList = [
  {
    "code": 1560,
    "name": "中砂",
    "order": 9
  },
  {
    "code": 2303,
    "name": "聯電",
    "order": 9
  },
  {
    "code": 2330,
    "name": "台積電",
    "order": "1"
  },
  {
    "code": 2342,
    "name": "茂矽",
    "order": 9
  },
  {
    "code": 4991,
    "name": "環宇-KY",
    "order": 9
  },
  {
    "code": 5347,
    "name": "世界",

  },
  {
    "code": 8028,
    "name": "昇陽半導體",
    "order": "2"
  }
];

classList.forEach((item) => {
  if (!item.hasOwnProperty('order')) {
    item.order = 9;
  } else {
    item.order = parseInt(item.order);
  }
  console.log(item.code, item.name, item.order);
});

classList.sort((a, b) => {
  return a.order - b.order;
});