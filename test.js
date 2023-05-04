const ethers = require("ethers");
const express = require("express");
const cors = require("cors");
const axios = require("axios");
// const { sendToBot, isChannelIdle, sendIdleMessage } = require("./telegram");

// The tokenABI Smart Contract ABI
const tokenABI = require("./abi/tokenABI.json");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname + "/static"));

    // Arbi Rush contract address
  const tokenAddress = "0x259aF8C0989212Ad65A5fced4B976c72FBB758B9";
  // real jackpot address
  const jackpotAddress = process.env.JP;

  // configuring Listener WebSocket
  const provider = new ethers.providers.WebSocketProvider(
    `wss://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_WEBSOCKET}`
  );

  console.log("Listener is running");
  // The Listener
  const contract = new ethers.Contract(tokenAddress, tokenABI, provider);

  contract.on("Transfer", async (from, to, value, event) => {
    let listener_to = to;
    let no_tokens = ethers.utils.formatUnits(value, 18);
    let initial_token = no_tokens;
    no_tokens =  parseFloat(no_tokens) + (parseFloat(no_tokens) * 0.145);


    let info = {
      from: from,
      to: to,
      value: ethers.utils.formatUnits(value, 18),
      data: event,
    };
    
    console.log(info);
});
async function get(){

  const transactionData = await provider.getTransactionReceipt("0x7951a5b4d4abb67900effaf8bbb47ac12ff578e00505ba50e2e6cc658fe7789c");

  console.log (JSON.stringify(transactionData,null,4));
  // console.log (JSON.stringify((Number(transactionData.logs[0].data)/(10 ** 18)),null,4));
  
  // const decodedInput = inter.parseTransaction({ data: transactionData.data, value: transactionData.value});
  
  // console.log (JSON.stringify(decodedInput,null,4));

  // abiDecoder.addABI(dABI);

// const decodedData = abiDecoder.decodeMethod(transactionData.data);

// console.log(JSON.stringify(ethers.utils.formatBytes32String(decodedData.params[0].value),null,4));
// const me = ethers.utils.
  //  console.log({
  //           function_name: decodedInput.name,
  //           from: transactionData.from,
  //           to: decodedInput.args[0],
  //           erc20Value: Number(decodedInput.args[1])
  //         });

          // console.log("\nArgs Number", Number(decodedInput.args[0].hex));
          const testObject = {
    "from": "0xeb034303A3C4380Aa78b14B86681bd0bE730De1C",
    "to": "0xb70c114B20d1EE068Dd4f5F36E301d0B604FEC18",
    "value": "30.288948384523385006",
    "data": {
        "blockNumber": 80429865,
        "blockHash": "0x3fca992614cdcb641a5544eb0a222b4a877d2908372cb02da9c6fb904293f7ee",
        "transactionIndex": 1,
        "removed": false,
        "address": "0xb70c114B20d1EE068Dd4f5F36E301d0B604FEC18",
        "data": "0x000000000000000000000000000000000000000000000001a457f613f7a878ae",
        "topics": [
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
            "0x000000000000000000000000eb034303a3c4380aa78b14b86681bd0be730de1c",
            "0x000000000000000000000000b70c114b20d1ee068dd4f5f36e301d0b604fec18"
        ],
        "transactionHash": "0x616376de3eadfa30924d76204f9f9ab5412182c61805206614eaa2eff97b058b",
        "logIndex": 12,
        "event": "Transfer",
        "eventSignature": "Transfer(address,address,uint256)",
        "args": [
            "0xeb034303A3C4380Aa78b14B86681bd0bE730De1C",
            "0xb70c114B20d1EE068Dd4f5F36E301d0B604FEC18",
            {
                "type": "BigNumber",
                "hex": "0x01a457f613f7a878ae"
            }
        ]
    }
}

// console.log(JSON.stringify(testObject.data.transactionHash,null,4));

  async function getEthUsdPrice() {
    try{
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=USD`
      );

      console.log(response.data.ethereum.usd);

    }catch (e){
      console.log("Error Reaching Dexscreener API");
      return cached_dexscreener_data;
    }
  }
  getEthUsdPrice();
}

get();