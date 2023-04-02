const ethers = require("ethers");
const express = require("express");
const cors = require('cors');
const axios = require("axios");
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

function sendToBot (data){
    winnerText = data.winner?`
    __We have a Winner__
    Chances of winning: *${data.eth_value}*%

    Congratulations! You won the lottery and have been rewarded with ${data.eth_value} ETH($${data.usd_value})
    `:`
    Not a winner
    Try again or head to the Camelot's Nitro Pool to earn ETH rewards`
    const params = {
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: `
        ${winnerText}
        *Current Jackpot:* ${data.from}
        *Next Jackpot:* ${data.to}
        *Nitro Pool rewards for next epoch:* ${data.value}

        *Chances of Winning:* ${data.lottery_percentage}%

        *Paid:* ${data.eth_value} ETH
        *Bought:* ${data.no_rush} RUSH
        *Price:* $${data.usd_value}
        *Market Cap:* ${data.marketcap}

        *[Buyer](https://arbiscan.io/address/${data.buyer_address}):*
        *[Transaction](https://arbiscan.io/tx/${data.transaction_hash}):*
        `,
        parse_mode: "MarkdownV2",
    }
    axios.post("https://api.telegram.org/bot"+process.env.TELEGRAM_BOT_TOKEN+"/sendMessage", params)
    .then((res) => {
        console.log("Telegram message sent");
    })
    .catch((err) => {
        console.log("Telegram message not sent");
    });
}

const getAddressBalance = async (contract, address, decimal=18) =>{
    const balance = (
        (await contract.balanceOf(address)) /
        10 ** decimal
      ).toString();
    return balance;
}

async function main (){
            
    let camelot_route = "0xeb034303A3C4380Aa78b14B86681bd0bE730De1C";
    let lottery_number = randomGen(10);
    console.log("lottery Number =>", lottery_number);

    // Arbi Rush contract address
    const arbiRushAddress = "0xb70c114B20d1EE068Dd4f5F36E301d0B604FEC18";
    const jackpotAddress = "0xcae0318ad82d6173164fc384d29a1cb264d13c94";

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

    function notWinner (){
        // send to bot
    }

    function winner(){
        //    send info to bot 
        setLotteryNumber();
    }

    function checkWinner (num){
        if (num == lottery_number){
            winner();
            return true;
        }else{
            notWinner();
            return false;
        }
    }
    

    // The Listener
    const contract = new ethers.Contract(arbiRushAddress, arbirushABI, provider);  
    contract.on("Transfer", async(from, to, value, event) => {

        let token_data = "";
        let listener_from = from;
        let listener_to = to;
        let no_tokens = ethers.utils.formatUnits(value, 18);
        const jackpot_balance = await getAddressBalance(contract, jackpotAddress);
        
        let info = {
            from :from,
            to: to,
            value: ethers.utils.formatUnits(value, 18),
            data: event,
        };
        // Using Dexscreener API to fetch price which is gotten from the token data object
        axios.get("https://api.dexscreener.com/latest/dex/tokens/0xb70c114B20d1EE068Dd4f5F36E301d0B604FEC18")
        .then((res) => {
            token_data = res.data.pairs[0];
            // console.log(token_data);

            let usd_value = token_data.priceUsd *1.0;
            let eth_value = token_data.priceNative *1.0;
            let marketcap = token_data.fdv *1.0;

            let eth_spent = no_tokens * eth_value;
            let usd_spent = no_tokens * usd_value;

            // if the tokens are coming from the Camelot router and not going back to the contract address
            //  but an actual wallet then its a buy

            if(from == camelot_route && to != arbiRushAddress){

                // check if transaction meets the lottery threshold

                let lottery_value = usd_spent;
                let lottery_number = "";
                let lottery_percentage = "";
                let winner = false;
                
                // $100 => 1%
                if ((lottery_value >= 100) && (lottery_value <= 200)){
                    lottery_number = randomGen(100);
                    lottery_percentage = 1;
                    console.log("1% buy lottery number =>",lottery_number);
                } else 
                // $200 => 2%
                if ((lottery_value >= 200) && (lottery_value <= 300)){
                    lottery_number = randomGen(90);
                    lottery_percentage = 2;
                    console.log("2% buy lottery number =>",lottery_number);
                } else 
                // $300 => 3%
                if ((lottery_value >= 300) && (lottery_value <= 400)){
                    lottery_number = randomGen(80);
                    lottery_percentage = 3;
                    console.log("3% buy lottery number =>",lottery_number);                } else 
                // $400 => 4%
                if ((lottery_value >= 400) && (lottery_value <= 500)){
                    lottery_number = randomGen(70);
                    lottery_percentage = 4;
                    console.log("4% buy lottery number =>",lottery_number);                } else 
                // $500 => 5%
                if ((lottery_value >= 500) && (lottery_value <= 600)){
                    lottery_number = randomGen(60);
                    lottery_percentage = 5;
                    console.log("5% buy lottery number =>",lottery_number);                }else 
                // $600 => 6%
                if ((lottery_value >= 600) && (lottery_value <= 700)){
                    lottery_number = randomGen(50);
                    lottery_percentage = 6;
                    console.log("6% buy lottery number =>",lottery_number);                }else
                // $700 => 7%
                if ((lottery_value >= 700) && (lottery_value <= 800)){
                    lottery_number = randomGen(40);
                    lottery_percentage = 7;
                    console.log("7% buy lottery number =>",lottery_number);                }else
                // $800 => 8%
                if ((lottery_value >= 800) && (lottery_value <= 900)){
                    lottery_number = randomGen(30);
                    lottery_percentage = 8;
                    console.log("8% buy lottery number =>",lottery_number);                } else
                // $900 => 9%
                if ((lottery_value >= 900) && (lottery_value <= 1000)){
                    lottery_number = randomGen(20);
                    lottery_percentage = 9;
                    console.log("9% buy lottery number =>",lottery_number);                }else
                // $1000 => 10%
                if ((lottery_value >= 1000)){
                    lottery_number = randomGen(10);
                    lottery_percentage = 10;
                    console.log("10% buy lottery number =>",lottery_number);
                } else if (lottery_value < 100){
                    console.log("Not enough for lottery");
                    lottery_percentage = 0;
                    return
                }

                // Check if winner
                winner = checkWinner(lottery_number);

                let bot_data = {
                    eth: eth_spent,
                    no_rush: no_tokens,
                    usd: usd_spent,
                    marketcap: marketcap,
                    buyer_address: listener_to,
                    transaction_hash: event.transactionHash,
                    lottery_percentage: lottery_percentage,
                    winner: winner
                }

                sendToBot(bot_data);

                // send to Bot
                console.log(JSON.stringify(info, null, 4));
                console.log("data =>",JSON.stringify(info.data, null, 4));
                console.log("Bot Data =>",JSON.stringify(bot_data, null, 4));

            }
        })
    })
}

main();