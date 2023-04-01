const ethers = require("ethers");
const express = require("express");
const cors = require('cors');
const axios = require("axios");

// The ArbiRush Smart Contract ABI
const arbirushABI = require("./abi/arbirushABI.json");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

async function main (){
            
    let camelot_route = "0xeb034303A3C4380Aa78b14B86681bd0bE730De1C";
    let lottery_number = 0;

    // Arbi Rush contract address
    const arbiRushAddress = "0xb70c114B20d1EE068Dd4f5F36E301d0B604FEC18";

    // configuring Listener WebSocket
    const provider = new ethers.providers.WebSocketProvider(
        `wss://arb-mainnet.g.alchemy.com/v2/-F-${process.env.ALCHEMY_WEBSOCKET}`
    );

    function randomGen (max){
        let min = 1;
        // find diff
        let difference = max - min;

        // generate random number 
        let rand = Math.random();

        // multiply with difference 
        rand = Math.floor( rand * difference);

        // add with min value 
        rand = rand + min;

        return rand;
    }

    function setLotteryNumber(){
        lottery_number = randomGen(10);
    }

    function checkWinner (num){
        if (num = lottery_number){
            winner();
            // return true;
        }else{
            notWinner();
            // return false;
        }
    }

    function notWinner (){
        // send to bot
    }

    function winner(){
    //    send to bot 
    }
    

    // The Listener
    const contract = new ethers.Contract(arbiRushAddress, arbirushABI, provider);  
    contract.on("Transfer", (from, to, value, event) => {

        let token_data = "";
        let listener_from = "";
        let listener_to = "";
        let no_tokens ="";
        
        // Using Dexscreener API to fetch price which is gotten from the token data object
        axios.get("https://api.dexscreener.com/latest/dex/tokens/0xb70c114B20d1EE068Dd4f5F36E301d0B604FEC18")
        .then((res) => {
            token_data = res.data.pairs[0];
            // console.log(token_data);
        })
        let usd_value = token_data.priceUsd *1;
        let eth_value = token_data.priceNative *1;
        let marketcap = token_data.fdv *1;


        let info = {
            from :from,
            to: to,
            value: ethers.utils.formatUnits(value, 18),
            data: event,
        };

        // transaction 'from' address
        listener_from = JSON.stringify(info.from, null, 4);

        // Transaction 'To' address
        listener_to = JSON.stringify(info.to, null, 4);

        // Transaction Value (number of Arbirush tokens)
        no_tokens = (JSON.stringify(info.value, null, 4) *1.0);

        let eth_spent = no_tokens * eth_value;
        let usd_spent = no_tokens * usd_value;

        let bot_data = {
            eth: eth_spent,
            no_rush: no_tokens,
            usd: usd_spent,
            marketcap: marketcap
        }
        // if the tokens are coming from the Camelot router and not going back to the contract address
        //  but an actual wallet then its a buy
        if(listener_from === camelot_route && listener_to !== arbiRushAddress){
            // check if transaction meets the lottery threshold
            var lottery_value = usd_spent;
            
            // $100 => 1%
            if ((lottery_value >= 100) && (lottery_value <= 200)){
                console.log("1% buy lottery number =>",randomGen(100));
            } else 
            // $200 => 2%
            if ((lottery_value >= 200) && (lottery_value <= 300)){
                console.log("2% buy lottery number =>",randomGen(90));
            } else 
            // $300 => 3%
            if ((lottery_value >= 300) && (lottery_value <= 400)){
                console.log("3% buy lottery number =>",randomGen(80));
            } else 
            // $400 => 4%
            if ((lottery_value >= 400) && (lottery_value <= 500)){
                console.log("4% buy lottery number =>",randomGen(700));
            } else 
            // $500 => 5%
            if ((lottery_value >= 500) && (lottery_value <= 600)){
                console.log("5% buy lottery number =>",randomGen(60));
            }else 
            // $600 => 6%
            if ((lottery_value >= 600) && (lottery_value <= 700)){
                console.log("6% buy lottery number =>",randomGen(50));
            }else
            // $700 => 7%
            if ((lottery_value >= 700) && (lottery_value <= 800)){
                console.log("7% buy lottery number =>",randomGen(40));
            }else
            // $800 => 8%
            if ((lottery_value >= 800) && (lottery_value <= 900)){
                console.log("8% buy lottery number =>",randomGen(30));
            } else
            // $900 => 9%
            if ((lottery_value >= 900) && (lottery_value <= 1000)){
                console.log("9% buy lottery number =>",randomGen(20));
            }else
            // $1000 => 10%
            if ((lottery_value >= 1000) && (lottery_value <= 777777)){
                console.log("10% buy lottery number =>",randomGen(10));
            }
            // send to Bot
            console.log(JSON.stringify(info, null, 4));
            console.log("data =>",JSON.stringify(info.data, null, 4));
            console.log(token_data.priceUsd);
        }
        console.log(JSON.stringify(info, null, 4));
        console.log("Bot Data =>",JSON.stringify(bot_data, null, 4));

    })
}

main();