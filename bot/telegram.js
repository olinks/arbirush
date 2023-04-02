const axios = require("axios");
const path = require("path");
const fs = require("fs");
const FormData = require("form-data");
require("dotenv").config();

function sendToBot(data) {
  const winnerText = data.winner
    ? `🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆


🐉🐉 __*WE HAVE A WINNER*__ 🐉🐉
*Chances of winning*: *${data.lottery_percentage}*%

🐉🏆Congratulations\\! You won the lottery and have been rewarded with ${data.eth} ETH\\($${data.usd}\\)
        `
    : `🤑🤑🤑🤑🤑🤑🤑🤑🤑🤑🤑🤑🤑

🥲Not a winner🥲
Better luck winning next time\\!🤞🏼`;

  const bodyText = `
*Current Jackpot:* ${data.current_jackpot}
*Next Jackpot:* ${data.next_jackpot}
*Third Jackpot:* ${data.next_jackpot}

*Chances of Winning:* ${data.lottery_percentage}%

*Paid:* ${data.eth} ETH
*Bought:* ${data.no_rush} RUSH

*$RUSH Price:* $${data.usd}
*Market Cap:* ${data.marketcap}
        `;
  const footerText = `
*[👤Buyer](https://arbiscan.io/address/${data.buyer_address})* \\| *[🧾Transaction](https://arbiscan.io/tx/${data.transaction_hash})*

*[💬Telegram](https://t.me/arbirushcasino)* \\| *[💻Website](https://arbirush.com)*
*[🐦Twitter](https://twitter.com/arbirushcasino)* \\| *[📈Chart](https://www.dextools.io/app/en/arbitrum/pair-explorer/0xeb034303a3c4380aa78b14b86681bd0be730de1c)*

*[💰Buy $RUSH Here](https://app.camelot.exchange/?token2=0xb70c114B20d1EE068Dd4f5F36E301d0B604FEC18)*
        `;

  const notWinnerVideo =
    "BAACAgQAAx0EcEgo4AACBYJkKbwsD3lv-PP2JA9Yix-bX7IrSAACPhEAAky-SVGvC0o2T5huoC8E";
  const winnerVideo =
    "BAACAgQAAx0EcEgo4AACBYFkKbvUAAEWBK-ryesWEbn-TP50e8IAAjkRAAJMvklRMI9F4GZUB-8vBA";
  const params = {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    video: data.winner === true ? winnerVideo : notWinnerVideo,
    caption: `
            ${winnerText}
            
            ${bodyText}

            ${footerText}
            `,
    parse_mode: "MarkdownV2",
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Buy Rush",
            url: "https://app.camelot.exchange/?token2=0xb70c114B20d1EE068Dd4f5F36E301d0B604FEC18",
          },
          {
            text: "DexTools",
            url: "https://www.dextools.io/app/en/arbitrum/pair-explorer/0xeb034303a3c4380aa78b14b86681bd0be730de1c",
          },
        ],
        [
          {
            text: "Whitepaper",
            url: "https://arbirush.com/whitepaper/",
          },
          {
            text: "Nitro Pools",
            url: "https://app.camelot.exchange/nitro/0xeb034303a3c4380aa78b14b86681bd0be730de1c",
          },
        ],
      ],
    },
  };
  axios
    .post(
      "https://api.telegram.org/bot" +
        process.env.TELEGRAM_BOT_TOKEN +
        "/sendVideo",
      params
    )
    .then((res) => {
      console.log("Telegram message sent");
    })
    .catch((err) => {
      console.log("Telegram message not sent");
      console.log(err);
    });
}

// sendToBot({
//   winner: true,
//   eth: 0.0,
//   usd: 0.0,
//   lottery_percentage: 0.0,
//   current_jackpot: 0.0,
//   next_jackpot: 0.0,
//   no_rush: 0.0,
//   marketcap: 0.0,
//   buyer_address: 0x00000,
//   transaction_hash: 0x00000,
// });

const getVideoId = async (videoName) => {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendDocument`;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  const filePath = path.join(__dirname, "media", videoName);
  console.log(filePath, chatId);

  const formData = new FormData();
  formData.append("chat_id", chatId);
  formData.append("document", fs.createReadStream(filePath));

  axios
    .post(url, formData)
    .then((data) => console.log(data.data.result.video.file_id))
    .catch((error) => console.error(error));
};

// getVideoId("jackpot-win.mp4");
// getVideoId("jackpot-lose.mp4");
exports.sendToBot = sendToBot;
