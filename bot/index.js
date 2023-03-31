const ethers = require("ethers");
const express = require("express");
const cors = require('cors');
const arbirushABI = require("./abi/arbirushABI.json");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
const blacklist = ["0xeb034303A3C4380Aa78b14B86681bd0bE730De1C",""]
async function main (){
    const arbiRushAddress = "0xb70c114B20d1EE068Dd4f5F36E301d0B604FEC18";
    const provider = new ethers.providers.WebSocketProvider(
        `wss://arb-mainnet.g.alchemy.com/v2/-F-${process.env.ALCHEMY_WEBSOCKET}`
        // `wss://arb-mainnet.g.alchemy.com/v2/-F-JBROwvpbeijkXqg2bbRWnjxd7fo8i`
    );

    const contract = new ethers.Contract(arbiRushAddress, arbirushABI, provider);  
    contract.on("Transfer", (from, to, value, event) => {
        let info = {
            from :from,
            to: to,
            value: ethers.utils.formatUnits(value, 18),
            data: event,
        };
        console.log(JSON.stringify(info, null, 4));
        console.log(JSON.stringify(info.from, null, 4));
        console.log(JSON.stringify(info.to, null, 4));
        console.log(JSON.stringify(info.value, null, 4));
        console.log("data =>",JSON.stringify(info.data, null, 4));
    })
}

main();