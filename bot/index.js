const app = require("./app");
const { startLottery } = require("./lottery");
require("dotenv").config();

taxWalletPrimaryKey = process.env.PK;
startLottery(taxWalletPrimaryKey);

app.listen(3000);
