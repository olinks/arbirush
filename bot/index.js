const app = require("./app");
const { startLottery } = require("./lottery");
require("dotenv").config();

const logger = require("./utils/logger");

taxWalletPrimaryKey = process.env.PK;
startLottery(taxWalletPrimaryKey);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
