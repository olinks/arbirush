const ethers = require("ethers");
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { sendToBot, isChannelIdle, sendIdleMessage } = require("./telegram");

// mysql dependency
const mysql = require("mysql");
// database connection
const db = require("./db/db");

// The ArbiRush Smart Contract ABI
const arbirushABI = require("./abi/arbirushABI.json");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname + "/static"));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "/index.html"));
});

app.post("/", function (req, res) {
  const pk = req.body.pk;
  // Here you can call the main function to start the bot
  main(pk);
  res.send("Bot is running");
});

app.get("/start", function (req, res) {
  res.sendFile(path.join(__dirname, "/index.html"));
});

app.post("/start", function (req, res) {
  const pk = req.body.pk;
  // Here you can call the main function to start the bot
  main(pk);
  res.send("Bot is running");
});

const getAddressBalance = async (provider, address, decimal = 18) => {
  const balanceWei = await provider.getBalance(address);
  const balance = ethers.utils.formatUnits(balanceWei, decimal);
  return balance;
};

async function main(pk) {
  console.log("Bot is running");

  // let lastBuyCountdown = null;
  let idleInterval = null;

  let camelot_route = "0xeb034303A3C4380Aa78b14B86681bd0bE730De1C";
  let lottery_number = randomGen(10);

  // Arbi Rush contract address
  const arbiRushAddress = "0xb70c114B20d1EE068Dd4f5F36E301d0B604FEC18";
  const jackpotAddress = "0xcae0318ad82d6173164fc384d29a1cb264d13c94";

  // configuring Listener WebSocket
  const provider = new ethers.providers.WebSocketProvider(
    `wss://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_WEBSOCKET}`
  );

  // The Listener
  const contract = new ethers.Contract(arbiRushAddress, arbirushABI, provider);
  const jackpot_balance = await getAddressBalance(provider, jackpotAddress);
  const jackpot_reward = jackpot_balance / 2;

  function randomGen(max) {
    let min = 1;
    // find diff
    let difference = max - min;

    // generate random number
    let rand = Math.random();

    // multiply with difference
    rand = Math.floor(rand * difference);

    // add with min value
    rand = rand + min;

    return rand;
  }

  function setLotteryNumber() {
    lottery_number = randomGen(10);
  }

  function notWinner() {
    // send to bot
  }

  function winner() {
    //    send info to bot
    // if (lastBuyCountdown) clearTimeout(lastBuyCountdown)
    setLotteryNumber();
  }

  async function pingIdleGroup(idleTimeSeconds) {
    const { usd_value, marketcap, eth_usd_price } = await getDexScreenerData();
    const bot_data = {
      rush_usd: usd_value,
      marketcap: marketcap,
      current_jackpot: jackpot_reward,
      next_jackpot: jackpot_reward / 2,
      third_jackpot: jackpot_reward / 2 / 1.5,
      eth_usd_price: eth_usd_price,
    };
    sendIdleMessage(bot_data);

    if (idleInterval) clearInterval(idleInterval);
    idleInterval = setInterval(() => {
      sendIdleMessage(bot_data);
      //   isChannelIdle(idleTimeSeconds)
      //     .then((result) => {
      //       if (result) {
      //         console.log("Channel is idle");
      //         // send to bot
      //         sendIdleMessage(bot_data);
      //       } else {
      //         console.log("Channel is active");
      //       }
      //     })
      //     .catch((err) => {
      //       console.log(err);
      //     });
    }, idleTimeSeconds * 1000);
  }

  async function sendRewards(addy, reward) {
    // RPC Connection to connect wallet to Blockchain
    const connection = new ethers.providers.JsonRpcProvider(
      `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_WEBSOCKET}`
    );
    // Get Gas Price
    const gasPrice = connection.getGasPrice();
    // connect wallet with key
    const wallet = ethers.Wallet(pk, connection);
    // Create signer for automatically signing transactions
    const signer = wallet.connect(connection);
    // winner address
    const winner_address = addy;
    // create the actuall transaction
    const tx = {
      from: wallet.address,
      to: addy,
      value: ethers.utils.parseUnits(reward, "ether"),
      gasPrice: gasPrice,
      gasLimit: ethers.utils.hexlify(100000),
      nonce: connection.getTransactionCount(wallet.address, "latest"),
    };
    // then we actually send thee transaction
    const transaction = await signer.sendTransaction(tx);
    console.log(transaction);
  }

  function checkWinner(num, addy, reward) {
    if (num == lottery_number) {
      winner();
      sendRewards(addy, reward);
      return true;
    } else {
      notWinner();
      return false;
    }
  }

  async function getDexScreenerData() {
    const response = await axios.get(
      "https://api.dexscreener.com/latest/dex/tokens/0xb70c114B20d1EE068Dd4f5F36E301d0B604FEC18"
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
    return data;
  }

  // function setLastBuyCountdown(address, amount){
  //     if(lastBuyCountdown) clearTimeout(lastBuyCountdown)
  //     lastBuyCountdown = setTimeout(sendToWinner, 1800000, address, amount)
  // }

  const idleTimeSeconds = 600; // 10 minutes
  try {
    await pingIdleGroup(idleTimeSeconds);
  } catch (err) {
    console.log("Error pinging group", err);
  }

  contract.on("Transfer", async (from, to, value, event) => {
    let listener_to = to;
    let no_tokens = ethers.utils.formatUnits(value, 18);

    let info = {
      from: from,
      to: to,
      value: ethers.utils.formatUnits(value, 18),
      data: event,
    };
    // Using Dexscreener API to fetch price which is gotten from the token data object
    try {
      const { usd_value, marketcap, eth_value, eth_usd_price } =
        await getDexScreenerData();
      let eth_spent = no_tokens * eth_value;
      let usd_spent = no_tokens * usd_value;

      // if the tokens are coming from the Camelot router and not going back to the contract address
      //  but an actual wallet then its a buy

      if (from == camelot_route && to != arbiRushAddress) {
        // check if transaction meets the lottery threshold

        let lottery_value = usd_spent;
        let lottery_number = "";
        let lottery_percentage = "";
        let winner = false;

        // $100 => 1%
        if (lottery_value >= 100 && lottery_value <= 200) {
          lottery_number = randomGen(100);
          lottery_percentage = 1;
          console.log("1% buy lottery number =>", lottery_number);
        }
        // $200 => 2%
        else if (lottery_value >= 200 && lottery_value <= 300) {
          lottery_number = randomGen(90);
          lottery_percentage = 2;
          console.log("2% buy lottery number =>", lottery_number);
        }
        // $300 => 3%
        else if (lottery_value >= 300 && lottery_value <= 400) {
          lottery_number = randomGen(80);
          lottery_percentage = 3;
          console.log("3% buy lottery number =>", lottery_number);
        }
        // $400 => 4%
        else if (lottery_value >= 400 && lottery_value <= 500) {
          lottery_number = randomGen(70);
          lottery_percentage = 4;
          console.log("4% buy lottery number =>", lottery_number);
        }
        // $500 => 5%
        else if (lottery_value >= 500 && lottery_value <= 600) {
          lottery_number = randomGen(60);
          lottery_percentage = 5;
          console.log("5% buy lottery number =>", lottery_number);
        }
        // $600 => 6%
        else if (lottery_value >= 600 && lottery_value <= 700) {
          lottery_number = randomGen(50);
          lottery_percentage = 6;
          console.log("6% buy lottery number =>", lottery_number);
        }
        // $700 => 7%
        else if (lottery_value >= 700 && lottery_value <= 800) {
          lottery_number = randomGen(40);
          lottery_percentage = 7;
          console.log("7% buy lottery number =>", lottery_number);
        }
        // $800 => 8%
        else if (lottery_value >= 800 && lottery_value <= 900) {
          lottery_number = randomGen(30);
          lottery_percentage = 8;
          console.log("8% buy lottery number =>", lottery_number);
        }
        // $900 => 9%
        else if (lottery_value >= 900 && lottery_value <= 1000) {
          lottery_number = randomGen(20);
          lottery_percentage = 9;
          console.log("9% buy lottery number =>", lottery_number);
        }
        // $1000 => 10%
        else if (lottery_value >= 1000) {
          lottery_number = randomGen(10);
          lottery_percentage = 10;
          console.log("10% buy lottery number =>", lottery_number);
        } else if (lottery_value < 0) {
          console.log("Not enough for lottery");
          lottery_percentage = 0;
          return;
        }

        // Dummy amount set here
        // setLastBuyCountdown(listener_to, 10000)

        // Check if winner
        winner = checkWinner(lottery_number, listener_to, jackpot_reward);

        let bot_data = {
          eth: eth_spent,
          no_rush: no_tokens,
          usd: usd_spent,
          rush_usd: usd_value,
          marketcap: marketcap,
          buyer_address: listener_to,
          current_jackpot: jackpot_reward,
          next_jackpot: jackpot_reward / 2,
          third_jackpot: jackpot_reward / 2 / 1.5,
          eth_usd_price: eth_usd_price,
          nitro_pool_rewards: null,
          transaction_hash: event.transactionHash,
          lottery_percentage: lottery_percentage,
          winner: winner,
        };

        // console.log(bot_data);
        sendToBot(bot_data);
        // send to Bot
        console.log(JSON.stringify(info, null, 4));
        console.log("data =>", JSON.stringify(info.data, null, 4));
        console.log("Bot Data =>", JSON.stringify(bot_data, null, 4));
      }
    } catch (error) {
      console.log(error);
    }
  });
}

// main();

app.listen(3001);
