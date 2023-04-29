const { getAllVideoIds } = require("./telegram");

getAllVideoIds().then((res) => {
  console.log(res);
});
