const ethers = require("ethers");
const axios = require("axios");
const { sendToBot, sendIdleMessage } = require("./telegram");
const ABI = require("./abi/tokenABI.json");
const db = require("./db/db");

require("dotenv").config();

// Define the chances of winning for each amount
const winningChances = {
  25: 0.0025,
  50: 0.005,
  75: 0.0075,
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
  if (num === 25 || num === 50 || num === 75) {
    return true;
  }

  if (num < 100 && num !== 25 && num !== 50 && num !== 75) {
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
  if (num === 25 || num === 50 || num === 75) {
    return num;
  }
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
  let lottery_percentage;
  if (buyAmount < 76) {
    lottery_percentage = winningChances[buyAmount] * 100;
    console.log(`${lottery_percentage} % buy lottery number =>`, buyAmount);
    return lottery_percentage;
  }
  const winningChance = roundToNearestWinningChance(buyAmount);
  lottery_percentage = winningChances[winningChance] * 100;
  console.log(`${lottery_percentage} % buy lottery number =>`, buyAmount);
  return lottery_percentage;
};

/**
 * Function to randomly select a winner based on the winning chances
 * @param {Number} lottery_percentage
 * @returns
 */
function checkLotteryWin(lottery_percentage) {
  const randomNum = Math.random();
  lottery_percentage = lottery_percentage / 100;
  console.log("randomNum", randomNum);
  console.log("lottery_percentage", lottery_percentage);
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
  var date_time = new Date();
  console.log("\n \nlOG TIME ::", date_time);
  console.log("Bot is running");

  let idleInterval = null;
  let cached_dexscreener_data = null;

  let camelot_route = "0xeb034303A3C4380Aa78b14B86681bd0bE730De1C";

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
  let jackpot_balance = await getAddressBalance(provider, jackpotAddress);
  let jackpot_reward = jackpot_balance / 2;

  async function pingIdleGroup(idleTimeSeconds) {
    let { jackpot_reward } = await getJackpotInfo();
    let { usd_value, marketcap, eth_usd_price } = await getDexScreenerData();
    let bot_data = {
      rush_usd: usd_value,
      marketcap: marketcap,
      current_jackpot: jackpot_reward,
      next_jackpot: jackpot_reward / 2,
      third_jackpot: jackpot_reward / 2 / 2,
      eth_usd_price: eth_usd_price,
    };
    sendIdleMessage(bot_data);

    if (idleInterval) clearInterval(idleInterval);
    idleInterval = setInterval(async () => {
      const { jackpot_reward } = await getJackpotInfo();
      const { usd_value, marketcap, eth_usd_price } =
        await getDexScreenerData();
      const bot_data = {
        rush_usd: usd_value,
        marketcap: marketcap,
        current_jackpot: jackpot_reward,
        next_jackpot: jackpot_reward / 2,
        third_jackpot: jackpot_reward / 2 / 2,
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
    console.log("recalculating balance after send rewards");
    jackpot_balance = await getAddressBalance(provider, jackpotAddress);
    jackpot_reward = jackpot_balance / 2;
    console.log(transaction);
    console.log("New jackpot balance => ", jackpot_reward);
  }

  const getJackpotInfo = async () => {
    const jackpot_balance = await getAddressBalance(provider, jackpotAddress);
    const jackpot_reward = jackpot_balance / 2;
    const next_jackpot = jackpot_reward / 2;
    const third_jackpot = jackpot_reward / 2 / 2;
    return { jackpot_balance, jackpot_reward, next_jackpot, third_jackpot };
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
      console.log("Error Reaching Dexscreener API", e);
      return cached_dexscreener_data;
      // return {
      //   usd_value: 1,
      //   eth_value: 1,
      //   marketcap: 1,
      //   eth_usd_price: 1,
      // };
    }
  }

  const idleTimeSeconds = 900; // 10 minutes
  try {
    await pingIdleGroup(idleTimeSeconds);
  } catch (err) {
    console.log("Error pinging group", err);
  }

  async function transferEventHandler(from, to, value, event) {
    console.log("transfer event handler", from, to, value, event);
    date_time = new Date();
    let listener_to = to;
    let no_tokens = ethers.utils.formatUnits(value, 18);
    let initial_token = no_tokens;
    no_tokens = parseFloat(no_tokens) / 0.864;

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

      if (from == camelot_route && to != tokenContactAddress) {
        // ##############################################################################################################################
        //  GETTING ETH VALUES
        // ##############################################################################################################################
        let { usd_value, marketcap, eth_value, eth_usd_price } =
          await getDexScreenerData();
        let eth_spent = parseFloat(no_tokens) * eth_value;
        let usd_spent = parseFloat(no_tokens) * usd_value;

        // check if transaction meets the lottery threshold
        date_time = new Date();
        console.log("\nlOG TIME ::", date_time);
        console.log(
          "Number of tokens after tax subtracted",
          parseFloat(initial_token)
        );
        console.log(
          "Dollar value after tax subtracted",
          parseFloat(initial_token) * usd_value
        );
        console.log("\nNumber of tokens before tax", parseFloat(no_tokens));
        console.log(
          "Dollar value before tax",
          parseFloat(no_tokens) * usd_value
        );
        console.log("\nUSD Value => ", usd_spent);
        let lottery_value = usd_spent;
        console.log("\n Lottery Value => ", lottery_value);
        let winner = false;

        if (!amountCanParticipate(lottery_value)) {
          console.log("Amount cannot participate");
        } else {
          const lottery_percentage = getBuyLotteryPercentage(lottery_value);
          winner = checkLotteryWin(lottery_percentage);
          if (winner) {
            console.log("Reward Passed => ", reward);
            jackpot_balance = await getAddressBalance(provider, jackpotAddress);
            jackpot_reward = jackpot_balance / 2;
            sendRewards(listener_to, jackpot_reward);
          }

          jackpot_balance = await getAddressBalance(provider, jackpotAddress);
          jackpot_reward = jackpot_balance / 2;

          let bot_data = {
            eth: eth_spent,
            no_rush: parseFloat(no_tokens),
            usd: usd_spent,
            rush_usd: usd_value,
            marketcap: marketcap,
            buyer_address: listener_to,
            current_jackpot: jackpot_reward,
            next_jackpot: jackpot_reward / 2,
            third_jackpot: jackpot_reward / 2 / 2,
            eth_usd_price: eth_usd_price,
            nitro_pool_rewards: null,
            transaction_hash: event.transactionHash,
            lottery_percentage: lottery_percentage,
            winner: winner,
            lottery_value,
          };

          // send to Bot
          sendToBot(bot_data);
          db.addTransaction(bot_data);
          //Log time
          date_time = new Date();
          console.log("\nlOG TIME ::", date_time);

          console.log(JSON.stringify(info, null, 4));
          console.log("data =>", JSON.stringify(info.data, null, 4));
          console.log("Bot Data =>", JSON.stringify(bot_data, null, 4));
        }
      }
    } catch (error) {
      console.log(error);
      startLottery(pk);
    }
  }

  contract.on("Transfer", transferEventHandler);

  /**
   * Triggers a dummy buy event
   * @param {Number} amount - The amount of tokens to buy in ETH
   */
  const triggerDummyEvent = async (amount = 900) => {
    // define the event object
    const event = {
      address: "0x123...",
      args: {
        from: "0xeb034303A3C4380Aa78b14B86681bd0bE730De1C", // Camelot Router
        to: "0x66F8E80e9D0fA95330504b0520E6CCFf956c8D55",
        value: ethers.utils.parseEther(amount.toString()),
      },
      blockNumber: 12345,
      transactionHash: ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("dummy-transaction-hash")
      ),
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

  // triggerDummyEvent();
  // setInterval(() => {
  //   console.log("Triggering Dummy Event");
  //   triggerDummyEvent();
  // }, 1000 * 60 * 5);
}

exports.startLottery = startLottery;
