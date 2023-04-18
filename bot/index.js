const ethers = require("ethers");
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const bodyparser = require("body-parser");
const { sendToBot, isChannelIdle, sendIdleMessage } = require("./telegram");
const accesskey = "0xArbi0x$RUSH";
var path = require('path');
pk = process.env.PK;
// mysql dependency
const mysql = require("mysql");
// database connection
const db = require("./db/db");

// The ArbiRush Smart Contract ABI
const arbirushABI = require("./abi/arbirushABI.json");
// ##########################################################
// const arbirushABI = require("./abi/lottoABI.json");
// ##########################################################
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
app.use(bodyparser.urlencoded({extended: true}));
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
app.use(express.static(__dirname + "/static"));

app.get("/restart",function(req, res) {
  res.sendFile(path.join(__dirname, "/static/restart.html"));
});
app.post("/restart",function(req, res) {
  const key = req.body.key;
  if(key === accesskey){
    main(pk);
    res.send("Restarted");
  }else{
    res.send("Wrong Key");
  }
});

app.get("/setLottery/:key/:val",function(req, res) {
  const key = req.params.key;
  const val = req.params.val;
  console.log("Val =>",val);
  if(key === accesskey){
    if(Number.isInteger(parseInt(val))){    
      main(pk);
      initial_lottery_number = val;
      res.send("Lottery Number Set");
    }else{
      res.send("that is not a number");
    }
  }else{
    res.send("Incorrect KEy");
  }

});

const getAddressBalance = async (provider, address, decimal = 18) => {
  const balanceWei = await provider.getBalance(address);
  const balance = ethers.utils.formatUnits(balanceWei, decimal);
  return balance;
};

async function main(pk) {
  var date_time = new Date();
  console.log("\n \nlOG TIME ::",date_time);
  console.log("Bot is running");

  // let lastBuyCountdown = null;
  let idleInterval = null;
  let cached_dexscreener_data = null;
// ################################################################
  let camelot_route = "0xeb034303A3C4380Aa78b14B86681bd0bE730De1C";
// ################################################################
  let initial_lottery_number = randomGen(10);
  console.log("initialised winning lottery number =>", initial_lottery_number);

  // Arbi Rush contract address
  const arbiRushAddress = "0xb70c114B20d1EE068Dd4f5F36E301d0B604FEC18";
  // const arbiRushAddress = "0x4A35cA865aBEc4205430081ccDF768610e06BfbC";
  // real jackpot address
  const jackpotAddress = process.env.JP;

  // configuring Listener WebSocket
  const provider = new ethers.providers.WebSocketProvider(
    `wss://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_WEBSOCKET}`
  );

  // The Listener
  const contract = new ethers.Contract(arbiRushAddress, arbirushABI, provider);
  let jackpot_balance = await getAddressBalance(provider, jackpotAddress);
  let jackpot_reward = jackpot_balance / 2;

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
    initial_lottery_number = randomGen(10);
  }

  function notWinner() {
    // send to bot
  }

  async function winner() {
    //    send info to bot
    // if (lastBuyCountdown) clearTimeout(lastBuyCountdown)
    setLotteryNumber();
  }

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

  async function sendRewards(addy, reward) {
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
    const winner_address = addy;
    // create the actuall transaction
    const tx = {
      from: wallet.address,
      to: addy,
      value: ethers.utils.parseEther(reward.toString()),
      gasPrice: gasPrice,
      gasLimit: ethers.utils.hexlify(35000000),
      nonce: connection.getTransactionCount(wallet.address, "latest"),
    };
    // then we actually send thee transaction
    const transaction = await signer.sendTransaction(tx);
    console.log("recalculating balance after send rewards");
    jackpot_balance = await getAddressBalance(provider, jackpotAddress);
    new_reward = await getJackpotInfo();
    jackpot_reward = new_reward.jackpot_reward;
    console.log(transaction);
    console.log("New jackpot balance => ", jackpot_reward);
  }

  async function checkWinner(num, addy, reward) {
      if (num == initial_lottery_number && (addy !== "0xdd94018F54e565dbfc939F7C44a16e163FaAb331")) {
        console.log("reward Passed => ", reward);
        jackpot_balance = await getAddressBalance(provider, jackpotAddress);
        jackpot_reward = jackpot_balance/2;
        console.log("new reward balance => ", jackpot_reward);
        sendRewards(addy, jackpot_reward);
        winner();
        return true;
      }
        else {
        notWinner();
        return false;
      }
  }

    const getJackpotInfo = async () => {
      const jackpot_balance = await getAddressBalance(provider, jackpotAddress);
      const eth_current_usd_price = await getEthUsdPrice();
      const jackpot_balance_usd = jackpot_balance * eth_current_usd_price;
      // Max Jackpot is $10,000 
      // check if jackpot is greater than $10,000
      if(jackpot_balance_usd <= 999.99){
        const jackpot_reward = jackpot_balance * (40/100);
        const next_jackpot = (jackpot_balance - jackpot_reward) * (40/100);
        const third_jackpot = "";
        return { jackpot_balance, jackpot_reward, next_jackpot, third_jackpot };
      }else{
        let e = 10000/eth_current_usd_price;
        let jackpot_balance = e;
        let jackpot_reward = jackpot_balance *(40/100);
        let next_jackpot = (jackpot_balance - jackpot_reward) *(40/100);
        const third_jackpot = "";
        return { jackpot_balance, jackpot_reward, next_jackpot, third_jackpot };
      }
  };

  async function getDexScreenerData() {
    try{
      const response = await axios.get(
        // #########################################################################################
        // `https://api.dexscreener.com/latest/dex/tokens/0xb70c114B20d1EE068Dd4f5F36E301d0B604FEC18`
        `https://api.dexscreener.com/latest/dex/tokens/0x4A35cA865aBEc4205430081ccDF768610e06BfbC`
        // #########################################################################################
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
    }catch (e){
      console.log("Error Reaching Dexscreener API");
      return cached_dexscreener_data;
    }
  }
  // FETCHING CURRENT ETH BALANCE FROM COINGECKO API
  async function getEthUsdPrice() {
    try{
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=USD`
      );

      console.log(response.data.ethereum.usd);
      let data = response.data.ethereum;

      return data.usd;
    }catch (e){
      console.log("Error Reaching Dexscreener API");
      return cached_dexscreener_data;
    }
  }

  // UPDATE DB
   const updateDb = async (data) => {
    let sql = "INSERT INTO transactions (buyer_address, eth_value, royale_value, lottery_number,lottery_percentage, winner, transaction_hash) VALUES (?,?,?,?,?,?)";
    db.query(sql,[data.buyer_address,data.eth,data.no_rush, lottery_number,data.lottery_percentage, data.winner,data.transaction_hash]);
   }

  // function setLastBuyCountdown(address, amount){
  //     if(lastBuyCountdown) clearTimeout(lastBuyCountdown)
  //     lastBuyCountdown = setTimeout(sendToWinner, 1800000, address, amount)
  // }

  const idleTimeSeconds = 1800; // 30 minutes
  try {
    await pingIdleGroup(idleTimeSeconds);
  } catch (err) {
    console.log("Error pinging group", err);
  }

  contract.on("Transfer", async (from, to, value, event) => {
    date_time = new Date();
    let initial_token = ethers.utils.formatUnits(value, 18);
    let no_tokens =  (parseFloat(initial_token) / 0.864);


    let info = {
      from: from,
      to: to,
      value: ethers.utils.formatUnits(value, 18),
      data: event,
    };

    console.log("Crosscheck ======>>",JSON.stringify(info,null,4));
    // Using Dexscreener API to fetch price which is gotten from the token data object
    try {
      


      // if the tokens are coming from the Camelot router and not going back to the contract address
      //  but an actual wallet then its a buy
      
      if (from == camelot_route && to != arbiRushAddress) {
// ##############################################################################################################################
//  GETTING ETH VALUES
        const transactionData = await provider.getTransactionReceipt(JSON.stringify(event.transactionHash,null,4));
        const eth_spent = (JSON.stringify((Number(transactionData.logs[0].data)/(10 ** 18)),null,4));
        console.log("transaction Data ===>>>",transactionData);
        console.log("The Eth spent from transaction ===>>>",eth_spent);
// ##############################################################################################################################
        let { eth_current_usd_price } = await getEthUsdPrice();
        let { usd_value, marketcap, eth_value, eth_usd_price } = await getDexScreenerData();
        let usd_spent = eth_spent * eth_current_usd_price;


        // check if transaction meets the lottery threshold
        date_time = new Date();
        console.log("\nlOG TIME ::",date_time);
        console.log("Number of tokens after tax subtracted",parseFloat(initial_token));
        console.log("Dollar value after tax subtracted",(parseFloat(initial_token)) * usd_value);
        console.log("\nNumber of tokens before tax",parseFloat(no_tokens));
        console.log("Dollar value before tax",(parseFloat(no_tokens)) * usd_value);
        console.log("\nUSD Value => ", usd_spent);
        let lottery_value = usd_spent;
        console.log("\n Lottery Value => ", lottery_value);
        let lottery_number = "";
        let lottery_percentage = "";
        let winner = false;

        // $25 => 0.25%
        if(lottery_value == 25){
          lottery_percentage = 0.25;
          console.log("1% buy lottery number =>", lottery_number);
        }
        // $50 => 0.5%
        else if(lottery_value == 50){
          lottery_percentage = 0.5;
          console.log("1% buy lottery number =>", lottery_number);
        }
        // $75 => 0.75%
        else if(lottery_value == 75){
          lottery_percentage = 0.75;
          console.log("1% buy lottery number =>", lottery_number);
        }
        // $100 => 1%
        else if (lottery_value > 99.99 && lottery_value < 199.99) {
          lottery_number = randomGen(100);
          lottery_percentage = 1;
          console.log("1% buy lottery number =>", lottery_number);
        }
        // $200 => 2%
        else if (lottery_value > 199.99 && lottery_value < 299.99) {
          lottery_number = randomGen(90);
          lottery_percentage = 2;
          console.log("2% buy lottery number =>", lottery_number);
        }
        // $300 => 3%
        else if (lottery_value > 299.99 && lottery_value < 399.99) {
          lottery_number = randomGen(80);
          lottery_percentage = 3;
          console.log("3% buy lottery number =>", lottery_number);
        }
        // $400 => 4%
        else if (lottery_value > 399.99 && lottery_value < 499.99) {
          lottery_number = randomGen(70);
          lottery_percentage = 4;
          console.log("4% buy lottery number =>", lottery_number);
        }
        // $500 => 5%
        else if (lottery_value > 499.99 && lottery_value < 599.99) {
          lottery_number = randomGen(60);
          lottery_percentage = 5;
          console.log("5% buy lottery number =>", lottery_number);
        }
        // $600 => 6%
        else if (lottery_value > 599.99 && lottery_value < 699.99) {
          lottery_number = randomGen(50);
          lottery_percentage = 6;
          console.log("6% buy lottery number =>", lottery_number);
        }
        // $700 => 7%
        else if (lottery_value > 699.99 && lottery_value < 799.99) {
          lottery_number = randomGen(40);
          lottery_percentage = 7;
          console.log("7% buy lottery number =>", lottery_number);
        }
        // $800 => 8%
        else if (lottery_value > 799.99 && lottery_value < 899.99) {
          lottery_number = randomGen(30);
          lottery_percentage = 8;
          console.log("8% buy lottery number =>", lottery_number);
        }
        // $900 => 9%
        else if (lottery_value > 899.99 && lottery_value < 999.99) {
          lottery_number = randomGen(20);
          lottery_percentage = 9;
          console.log("9% buy lottery number =>", lottery_number);
        }
        // $1000 => 10%
        else if (lottery_value > 999.99 || lottery_value >= 1000) {
          lottery_percentage = 10;
          lottery_number = randomGen(10);
          console.log("10% buy lottery number =>", lottery_number);
        }
        // not upto the lottery
        else {
          console.log("Not enough for lottery");
          lottery_percentage = 0;
          date_time = new Date();
          console.log("lOG TIME ::",date_time);
          // ##############################
          // return;
          // ##############################
        }

        // Dummy amount set here
        // setLastBuyCountdown(to, 10000)

        console.log("Current winning lottery number =>", initial_lottery_number);
        jackpot_balance = await getAddressBalance(provider, jackpotAddress);
        jackpot_reward = jackpot_balance * (40/100);
        // Check if winner
        winner = await checkWinner(lottery_number, to, jackpot_reward);


        let bot_data = {
          eth: eth_spent,
          no_rush: parseFloat(no_tokens),
          usd: usd_spent,
          rush_usd: usd_value,
          marketcap: marketcap,
          buyer_address: to,
          current_jackpot: jackpot_reward,
          next_jackpot: jackpot_reward / 2,
          third_jackpot: ((jackpot_reward / 2) /2),
          eth_usd_price: eth_usd_price,
          nitro_pool_rewards: null,
          transaction_hash: event.transactionHash,
          lottery_percentage: lottery_percentage,
          winner: winner,
        };

        // console.log(bot_data);
        // send to Bot
        sendToBot(bot_data);
        // Send to Database
        updateDb(bot_data);
        //Log time  
        date_time = new Date();
        console.log("\nlOG TIME ::",date_time);

        console.log(JSON.stringify(info, null, 4));
        console.log("data =>", JSON.stringify(info.data, null, 4));
        console.log("Bot Data =>", JSON.stringify(bot_data, null, 4));
      }
    } catch (error) {
      console.log(error);
      main(pk);
    }
  });
}
pk = process.env.PK;
main(pk);

app.listen(3000);