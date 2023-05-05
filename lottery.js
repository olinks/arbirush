const ethers = require("ethers");
const axios = require("axios");
const { sendToBot, sendIdleMessage } = require("./telegram");
const ABI = require("./abi/tokenABI.json");
const db = require("./db/db");
const logger = require("./utils/logger");

require("dotenv").config();

// Define the chances of winning for each amount
const winningChances = {
  25: 0.0025,
  // 26: 0.00256,
  // 27: 0.0027,
  // 28: 0.0028,
  // 29: 0.0029,
  // 30: 0.0030,
  // 31: 0.0031,
  // 32: 0.0032,
  // 33: 0.0033,
  // 34: 0.0034,
  // 35: 0.0035,
  // 36: 0.0036,
  // 37: 0.0037,
  // 38: 0.0038,
  // 39: 0.0039,
  // 40: 0.0040,
  // 41: 0.0041,
  // 42: 0.0042,
  // 43: 0.0043,
  // 44: 0.0044,
  // 45: 0.0045,
  // 46: 0.0046,
  // 47: 0.0047,
  // 48: 0.0048,
  // 49: 0.0049,
  50: 0.005,
  // 51: 0.0051,
  // 52: 0.0052,
  // 53: 0.0053,
  // 54: 0.0054,
  // 55: 0.0055,
  // 56: 0.0056,
  // 57: 0.0057,
  // 58: 0.0058,
  // 59: 0.0059,
  // 60: 0.0060,
  // 61: 0.0061,
  // 62: 0.0062,
  // 63: 0.0063,
  // 64: 0.0064,
  // 65: 0.0065,
  // 66: 0.0066,
  // 67: 0.0067,
  // 68: 0.0068,
  // 69: 0.0069,
  // 70: 0.0070,
  // 71: 0.0071,
  // 72: 0.0072,
  // 73: 0.0073,
  // 74: 0.0074,
  75: 0.0075,
  // 76: 0.0076,
  // 77: 0.0077,
  // 78: 0.0078,
  // 79: 0.0079,
  // 80: 0.0080,
  // 81: 0.0081,
  // 82: 0.0082,
  // 83: 0.0083,
  // 84: 0.0084,
  // 85: 0.0085,
  // 86: 0.0086,
  // 87: 0.0087,
  // 88: 0.0088,
  // 89: 0.0089,
  // 90: 0.0090,
  // 91: 0.0091,
  // 92: 0.0092,
  // 93: 0.0093,
  // 94: 0.0094,
  // 95: 0.0095,
  // 96: 0.0096,
  // 97: 0.0097,
  // 98: 0.0098,
  // 99: 0.0099,
  100: 0.01,
  200: 0.02,
  300: 0.03,
  400: 0.04,
  500: 0.05,
  600: 0.06,
  700: 0.07,
  800: 0.08,
  900: 0.09,
  1000: 0.1,
};
/**
 *
 * @param {Number} num
 * @returns {Boolean}
 */
function amountCanParticipate(num) {
  if (num < 25) {
    return false;
  }
  return true;
}
/**
 *
 * @param {Number} num
 * @returns {Number}
 */
function roundToNearestWinningChance(num) {
  if (!amountCanParticipate(num)) return;
  let winningChancesArray = Object.keys(winningChances);
  let closestChance = winningChancesArray.reduce((prev, curr) => {
    return Math.abs(curr - num) < Math.abs(prev - num) ? curr : prev;
  });
  return Object.keys(winningChances)[
    winningChancesArray.indexOf(closestChance)
  ];
}
/**
 *
 * @param {Number} buyAmount
 * @returns
 */
const getBuyLotteryPercentage = (buyAmount) => {
  const winningChance = roundToNearestWinningChance(buyAmount);
  const lottery_percentage = winningChances[winningChance] * 100;
  logger.info(`${lottery_percentage} % buy lottery number => `, buyAmount);
  return lottery_percentage;
};

/**
 * Function to randomly select a winner based on the winning chances
 * @param {Number} lottery_percentage
 * @returns
 */
function checkLotteryWin(lottery_percentage) {
    if(address == "0x259aF8C0989212Ad65A5fced4B976c72FBB758B9" || address == "0x1144BcC225335B07b1239c78e9801164C4419e38" || address == "0x259af8c0989212ad65a5fced4b976c72fbb758b9" || address == "0x1111111254eeb25477b68fb85ed929f73a960582" || address == "0x64768A3a2453F1E8DE9e43e92D65Fc36E4c9872d"){
    return false;
  }
  const randomNum = Math.random();
  lottery_percentage = lottery_percentage / 100;
  if (randomNum <= lottery_percentage) {
    return true;
  }
  return false;
}

const getAddressBalance = async (provider, address, decimal = 18) => {
  const balanceWei = await provider.getBalance(address);
  const balance = ethers.utils.formatUnits(balanceWei, decimal);
  return balance;
};
/**
 * Starts RUSH Lottery Instance
 * @param {String} pk
 */
async function startLottery(pk) {
  logger.info("Bot is running");

  let idleInterval = null;
  let cached_dexscreener_data = null;
  let cached_coingecko_data = null;

  let routerLiquidityPairAddress = "0x1144bcc225335b07b1239c78e9801164c4419e38";

  // Token contract address
  const tokenContactAddress = "0x259aF8C0989212Ad65A5fced4B976c72FBB758B9";
  // real jackpot address
  const jackpotAddress = process.env.JP;

  // configuring Listener WebSocket
  const provider = new ethers.providers.WebSocketProvider(
    `wss://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_WEBSOCKET}`
  );

  // The Listener
  const contract = new ethers.Contract(tokenContactAddress, ABI, provider);

  async function pingIdleGroup(idleTimeSeconds) {
    let { jackpot_reward, next_jackpot } = await getJackpotInfo();
    let { usd_value, marketcap, eth_usd_price } = await getDexScreenerData();
    let bot_data = {
      rush_usd: usd_value,
      marketcap: marketcap,
      current_jackpot: jackpot_reward,
      next_jackpot,
      eth_usd_price: eth_usd_price,
    };
    sendIdleMessage(bot_data);

    if (idleInterval) clearInterval(idleInterval);
    idleInterval = setInterval(async () => {
      const { jackpot_reward, next_jackpot } = await getJackpotInfo();
      const { usd_value, marketcap, eth_usd_price } =
        await getDexScreenerData();
      const bot_data = {
        rush_usd: usd_value,
        marketcap: marketcap,
        current_jackpot: jackpot_reward,
        next_jackpot,
        eth_usd_price: eth_usd_price,
      };
      sendIdleMessage(bot_data);
    }, idleTimeSeconds * 1000);
  }

  /**
   * Send lottery win reward to winner
   * @param {String} address
   * @param {Number} reward
   */
  async function sendRewards(address, reward) {
    // RPC Connection to connect wallet to Blockchain
    if(address == "0x259aF8C0989212Ad65A5fced4B976c72FBB758B9" || address == "0x1144BcC225335B07b1239c78e9801164C4419e38" || address == "0x259af8c0989212ad65a5fced4b976c72fbb758b9" || address == "0x1111111254eeb25477b68fb85ed929f73a960582" || address == "0x64768A3a2453F1E8DE9e43e92D65Fc36E4c9872d"){
      address = process.env.JP;
      return;
    }
    const connection = new ethers.providers.JsonRpcProvider(
      `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_WEBSOCKET}`
    );
    // Get Gas Price
    const gasPrice = connection.getGasPrice();
    // connect wallet with key
    pk = process.env.PK;
    const wallet = new ethers.Wallet(pk, connection);
    // Create signer for automatically signing transactions
    const signer = wallet.connect(connection);
    // winner address
    const winner_address = address;
    // create the actual transaction
    const tx = {
      from: wallet.address,
      to: address,
      value: ethers.utils.parseEther(reward.toString()),
      gasPrice: gasPrice,
      gasLimit: ethers.utils.hexlify(35000000),
      nonce: connection.getTransactionCount(wallet.address, "latest"),
    };
    // then we actually send thee transaction
    const transaction = await signer.sendTransaction(tx);
    logger.info(transaction);
    logger.info("Recalculating balance after send rewards");
    const { jackpot_reward } = await getJackpotInfo();
    logger.info("New jackpot balance => ", jackpot_reward);
  }

  const getJackpotInfo = async () => {
    const eth_current_usd_price = await getEthUsdPrice();
    const jackpot_balance = await getAddressBalance(provider, jackpotAddress);
    const jackpot_balance_usd = jackpot_balance * eth_current_usd_price;
    const REWARD_PERCENTAGE = 0.4; // 40% of jackpot goes to winner

    // Set max jackpot reward to $10k
    if (jackpot_balance_usd > 10000) {
      jackpot_balance = 10000 / eth_current_usd_price;
    }
    const jackpot_reward = jackpot_balance * REWARD_PERCENTAGE;
    const next_jackpot = (jackpot_balance - jackpot_reward) * REWARD_PERCENTAGE;
    return { jackpot_balance, jackpot_reward, next_jackpot };
  };

  /**
   *
   * @returns {Promise<{
   *    usd_value: number,
   *    eth_value: number,
   *    marketcap: number,
   *    eth_usd_price: number
   *  }> | null}
   */
  async function getDexScreenerData() {
    try {
      const response = await axios.get(
        "https://api.dexscreener.com/latest/dex/tokens/0x259aF8C0989212Ad65A5fced4B976c72FBB758B9"
      );
      token_data = response.data.pairs[0];
      let usd_value = token_data.priceUsd * 1.0;
      let eth_value = token_data.priceNative * 1.0;
      let marketcap = token_data.fdv * 1.0;
      let eth_usd_price = (1 / eth_value) * usd_value;

      let data = {
        usd_value: usd_value,
        eth_value: eth_value,
        marketcap: marketcap,
        eth_usd_price: eth_usd_price,
      };
      cached_dexscreener_data = data;
      return data;
    } catch (e) {
      logger.info("Error Reaching Dexscreener API ", e);
      return cached_dexscreener_data;
      // return {
      //   usd_value: 1,
      //   eth_value: 1,
      //   marketcap: 1,
      //   eth_usd_price: 1,
      // };
    }
  }

  /**
   * Fetch Current ETH balance From Coingecko API
   *
   * @returns {Promise<number>}
   */
  async function getEthUsdPrice() {
    try {
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=USD`
      );
      let data = response.data.ethereum;
      cached_coingecko_data = data;
      return data.usd;
    } catch (e) {
      logger.info("Error Reaching Coingecko API ", e);
      return cached_coingecko_data;
    }
  }

  const idleTimeSeconds = 900; // 15 minutes
  try {
    await pingIdleGroup(idleTimeSeconds);
  } catch (err) {
    logger.info("Error pinging group", err);
  }

  const getWethSpent = (txnData) => {
    const WETH_CONTRACT = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1";
    const WETH_DECIMALS = 18;
    const wethTxn = txnData.logs.find((log) => log.address === WETH_CONTRACT);
    return parseInt(wethTxn.data) / 10 ** WETH_DECIMALS;
  };

  async function transferEventHandler(from, to, value, event) {
    logger.info("Event Caught =>", from, to, value, event);
    const TAX_FEE = 0.136; // 13.6% tax fee
    const TAX_FEE_REVERSE = 1 - TAX_FEE;
    const TOKEN_DECIMALS = 9;

    let initial_token = ethers.utils.formatUnits(value, TOKEN_DECIMALS);
    // Initial token has a 12.4% tax on it, so we need to remove that
    let no_tokens = parseFloat(initial_token) / TAX_FEE_REVERSE;

    let info = {
      from: from,
      to: to,
      value: ethers.utils.formatUnits(value, 18),
      data: event,
    };
    // Using Dexscreener API to fetch price which is gotten from the token data object
    try {
      // if the tokens are coming from the Camelot router and not going back to the contract address
      //  but an actual wallet then its a buy

      if ((from == routerLiquidityPairAddress || to != routerLiquidityPairAddress || (from != "0x1111111254eeb25477b68fb85ed929f73a960582")) && ((to != tokenContactAddress) || (to != "0x1111111254eeb25477b68fb85ed929f73a960582") || (to != "0x64768A3a2453F1E8DE9e43e92D65Fc36E4c9872d") || to != ("0x1144bcc225335b07b1239c78e9801164c4419e38"))) {
      // if (from != tokenContactAddress) {
      // if (from == routerLiquidityPairAddress && to != tokenContactAddress) {

        // ##############################################################################################################################
        //  GETTING ETH VALUES
        const transactionData = await provider.getTransactionReceipt(
          event.transactionHash
        );
        const eth_spent = getWethSpent(transactionData);
        // ##############################################################################################################################
        let { usd_value, marketcap, eth_usd_price } =
          await getDexScreenerData();
        let eth_current_usd_price = await getEthUsdPrice();
        let usd_spent = eth_spent * eth_current_usd_price;

        // check if transaction meets the lottery threshold
        logger.info(
          "Number of tokens after tax subtracted",
          parseFloat(initial_token)
        );
        logger.info(
          "Dollar value after tax subtracted",
          parseFloat(initial_token) * usd_value
        );
        logger.info("\nNumber of tokens before tax", parseFloat(no_tokens));
        logger.info(
          "Dollar value before tax",
          parseFloat(no_tokens) * usd_value
        );
        logger.info("\nUSD Value =>", usd_spent);
        let winner = false;

        if (!amountCanParticipate(usd_spent)) {
          logger.info("Amount cannot participate =>", usd_spent);
        } 
        else if(to == "0x1144BcC225335B07b1239c78e9801164C4419e38" || from == "0x259af8c0989212ad65a5fced4b976c72fbb758b9" || to == "0x1111111254eeb25477b68fb85ed929f73a960582" || to ==tokenContactAddress || from =="0x1111111254eeb25477b68fb85ed929f73a960582" || from =="0x64768A3a2453F1E8DE9e43e92D65Fc36E4c9872d" || to == "0x64768A3a2453F1E8DE9e43e92D65Fc36E4c9872d" ){

        }
        else{
          const lottery_percentage = getBuyLotteryPercentage(usd_spent);
          winner = checkLotteryWin(lottery_percentage);
          if (winner) {
            logger.info("Reward Passed =>", reward);
            const { jackpot_reward } = await getJackpotInfo();
            sendRewards(to, jackpot_reward);
          }
          const { jackpot_reward, next_jackpot } = await getJackpotInfo();

          let bot_data = {
            eth: eth_spent,
            no_rush: parseFloat(no_tokens),
            usd: usd_spent,
            rush_usd: usd_value,
            marketcap: marketcap,
            buyer_address: to,
            current_jackpot: jackpot_reward,
            next_jackpot,
            eth_usd_price: eth_usd_price,
            transaction_hash: event.transactionHash,
            lottery_percentage: lottery_percentage,
            winner: winner,
          };

          // send to Bot
          await sendToBot(bot_data);
          db.addTransaction(bot_data);

          logger.info(JSON.stringify(info, null, 4));
          logger.info("data =>", JSON.stringify(info.data, null, 4));
          logger.info("Bot Data =>", JSON.stringify(bot_data, null, 4));
        }
      }
    } catch (error) {
      logger.info(error);
      startLottery(pk);
    }
  }

  contract.on("Transfer", transferEventHandler);

  /**
   * Triggers a dummy buy event
   * @param {Number} amount - The amount of tokens to buy in ETH
   */
  const triggerDummyEvent = async (amount = 0.027) => {
    // define the event object
    const event = {
      address: "0x123...",
      args: {
        from: "0x1144bcc225335b07b1239c78e9801164c4419e38", // WETH LP
        to: "0xf406af325c6b361f040612142267ab8feac97f1f",
        value: ethers.utils.parseEther(amount.toString()),
      },
      blockNumber: 12345,
      transactionHash:
        // "0x30c773cb40c1cd2bc3d78fb5070c2a1d8e398e0f913790d6aeca01f766b48ea5", // $79
      // "0xa197b1e81885a28a81b1c501fd28daf1b7240aaefbaf46df9dd3a04667c624e0", // $198
        // "0x17da3ec319052b3410ccfa896c0fab558e0db1f1fd6e4196ba064456434b7a38",
        "0x5fe93997dbbf5e2499cb58ab718032573b7544134cebaca14579dd779c4fb6a0", //$28
    };

    // trigger a dummy event
    contract.emit(
      "Transfer",
      event.args.from,
      event.args.to,
      event.args.value,
      event
    );
  };

  // Uncomment this to trigger dummy buy events

  // triggerDummyEvent(Math.random());
  // setInterval(() => {
  //   console.log("Triggering Dummy Event");
  //   triggerDummyEvent(Math.random());
  // }, 1000 * 60 * 30);
}

exports.startLottery = startLottery;
