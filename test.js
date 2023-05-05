const axios = require("axios");
let token_data = {};
 async function getData(){
     await axios.get("https://api.dexscreener.com/latest/dex/tokens/0xb70c114B20d1EE068Dd4f5F36E301d0B604FEC18")
     .then((res) => {
        let p = res.data.pairs;
        return {p};
     })
    }
        // .then(res => {
        //     token_data = (res.data.pairs[0]);
        // })
        token_data = getData();
        console.log(token_data);
        // let usd_value = token_data.priceUsd;
        // let eth_value = token_data.priceNative;
        // let marketcap = token_data.fdv;
        // let no_tokens = 1;

        // let eth_spent = no_tokens * eth_value;
        // let usd_spent = no_tokens * usd_value;

        // let bot_data = {
        //     eth: eth_spent,
        //     no_rush: no_tokens,
        //     usd: usd_spent,
        //     marketcap: marketcap
        // }

        // console.log(bot_data);