const axios = require("axios");
const ethers = require("ethers");
require("dotenv").config();

async function getData(){

    // exempted Addresses
    const exemptedAddress = ["0x73537ae1589e2983c22b685e7745d167465560e2", "0x407993575c91ce7643a4d4ccacc9a98c36ee1bbe"]

    // Connect to BSC RPC
    const bsc_conn =  new ethers.providers.WebSocketProvider(`wss://weathered-billowing-valley.bsc.discover.quiknode.pro/4f3075cae6df230aa538a431279c63c9acf16b4e/`);

    // Randomiser
    function randomPicker(){
        const r = Math.floor(Math.random() * 10);
        console.log(r);
    }

    // Function to Send Rewards
    async function sendRewards(address, reward) {
        // RPC Connection to connect wallet to Blockchain
        const connection = new ethers.providers.JsonRpcProvider(
        `wss://weathered-billowing-valley.bsc.discover.quiknode.pro/4f3075cae6df230aa538a431279c63c9acf16b4e/`
        );
        // Get Gas Price
        const gasPrice = connection.getGasPrice();
        // connect wallet with key
        pk = process.env.FINE_PK;
        const wallet = new ethers.Wallet(pk, connection);
        // Create signer for automatically signing transactions
        const signer = wallet.connect(connection);
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
    }
    // Function to Fetch Lottery Balance
    async function getLotteryBalance (){    //  const fine_lottery_wallet = "0x7D13929DcE1fc0DE7546d85C66Fa48FA6B5d1810";
     const fine_lottery_wallet = "0xe791616892c4c5be5cF35A6245b7550EDC6F5C3B";
     let fine_wallet_balance = await bsc_conn.getBalance(fine_lottery_wallet);
     return await ethers.utils.formatEther(fine_wallet_balance);
    }
    // Function to Get Holders
    async function getHolders(){

        let config = {
        method: 'get',
        maxBodyLength: Infinity,
        // url: 'https://api.covalenthq.com/v1/eth-mainnet/tokens/0x6982508145454Ce325dDbE47a25d4ec3d2311933/token_holders_v2/',
        // url: 'https://api.covalenthq.com/v1/bsc-mainnet/tokens/0x3b95702DD0cE375462F131f805f9EE6E1563F8D5/token_holders_v2/',
        // url: 'https://api.covalenthq.com/v1/bsc-mainnet/tokens/0xE03E306466965D242dB8c562bA2ce230472Ca9b3/token_holders_v2/',
        url: 'https://api.covalenthq.com/v1/bsc-mainnet/tokens/0xE03E306466965D242dB8c562bA2ce230472Ca9b3/token_holders_v2/?page-number=5',
        headers: { 
            'Content-Type': 'application/json', 
            'Authorization': 'Basic Y3F0X3dGOTNrQ3JNMzhDV1RIa2d4WUtoZ1QzUHg3WW06',
            'page_number': '5'
        }
        };

        axios.request(config)
        .then((response) => {
        console.log(JSON.stringify(response.data, null, 4));
        })
        .catch((error) => {
        console.log(error);
        });


        // return holders;
    }
    // Check if address is holding > 0 Tokens
    function isHolding(h){
        if(h.TokenHolderQuantity > 0){
            return true;
        }
    }
    // check if its exempted from lottery
    function isExempted(a){
        if(exemptedAddress.includes(a)){
            return true;
        }
    }
    // Main Lottery Function
    async function lottery(){
        const balance = getLotteryBalance();
        let allHolders = {};
        if(balance >= 10){
            allHolders = getHolders();

            sendRewards(allHolders[0], balance);
        }
    }

    // getHolders();
    randomPicker();
}
getData();