const axios = require("axios");
const path = require("path");
const fs = require("fs");
const FormData = require("form-data");
require("dotenv").config();

function parseToMarkdown(text) {
  const charactersToEscape = [
    "_",
    "*",
    "[",
    "]",
    "(",
    ")",
    "~",
    "`",
    ">",
    "#",
    "+",
    "-",
    "=",
    "|",
    "{",
    "}",
    ".",
    "!",
  ];
  let newText = text.toString();
  charactersToEscape.forEach((character) => {
    newText = newText.replace(
      new RegExp("\\" + character, "g"),
      "\\" + character
    );
  });
  return newText;
}

const inlineKeyboard = [
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
      text: "Dexscreener",
      url: "https://dexscreener.com/arbitrum/0xeb034303a3c4380aa78b14b86681bd0be730de1c",
    },
  ],
];

function sendToBot(data) {
  // console.log(data);
  const winnerText = data.winner
    ? `🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆


🐉🐉 __*WE HAVE A WINNER*__ 🐉🐉
*Chances of winning*: *${data.lottery_percentage}*%

🐉🏆Congratulations\\! You won the lottery and have been rewarded with ${parseToMarkdown(
        data.eth
      )} ETH\\($${parseToMarkdown(data.usd)}\\)
        `
    : `🤑🤑🤑🤑🤑🤑🤑🤑🤑🤑🤑🤑🤑

🥲Not a winner🥲
Better luck winning next time\\!🤞🏼`;

  const bodyText = `
*Current Jackpot:* ${parseToMarkdown(data.current_jackpot)} ETH
*Next Jackpot:* ${parseToMarkdown(data.next_jackpot)} ETH
*Third Jackpot:* ${parseToMarkdown(data.third_jackpot)} ETH

*Chances of Winning:* ${data.lottery_percentage}%

*Paid:* ${parseToMarkdown(data.eth)} ETH
*Bought:* ${parseToMarkdown(data.no_rush)} RUSH

*$RUSH Price:* $${parseToMarkdown(data.rush_usd)}
*Market Cap:* ${parseToMarkdown(data.marketcap)}
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
      inline_keyboard: inlineKeyboard,
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

function sendIdleMessage(data) {
  // console.log(data);
  const bodyText = `
*Current Jackpot:* ${parseToMarkdown(data.current_jackpot)} ETH
*Next Jackpot:* ${parseToMarkdown(data.next_jackpot)} ETH
*Third Jackpot:* ${parseToMarkdown(data.third_jackpot)} ETH

*$RUSH Price:* $${parseToMarkdown(data.rush_usd)}
*Market Cap:* ${parseToMarkdown(data.marketcap)}
        `;
  const footerText = `
*[💬Telegram](https://t.me/arbirushcasino)* \\| *[💻Website](https://arbirush.com)*
*[🐦Twitter](https://twitter.com/arbirushcasino)* \\| *[📈Chart](https://www.dextools.io/app/en/arbitrum/pair-explorer/0xeb034303a3c4380aa78b14b86681bd0be730de1c)*

*[💰Buy $RUSH Here](https://app.camelot.exchange/?token2=0xb70c114B20d1EE068Dd4f5F36E301d0B604FEC18)*
          `;
  const params = {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    video:
      "BAACAgQAAx0CcEgo4AACBZtkKpVvzm37EkYw-L3APKddAXK2sQAC1Q0AApKRUFHGXjbCMSDQXS8E",
    caption: `
            ${bodyText}

            ${footerText}
    `,
    parse_mode: "MarkdownV2",
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: inlineKeyboard,
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

// sendIdleMessage({
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

// Check if the channel has been idle for over 5 minutes
async function isChannelIdle(idleTimeSeconds = 300) {
  const response = await axios.get(
    "https://api.telegram.org/bot" +
      process.env.TELEGRAM_BOT_TOKEN +
      "/getUpdates?offset=-1"
  );
  const data = response.data;

  if (data.ok && data.result && data.result.length > 0) {
    const lastMessageDate = data.result[0].message.date;
    const now = Math.floor(Date.now() / 1000);
    const idleTime = now - lastMessageDate;
    return idleTime >= idleTimeSeconds; // Return true if idle time is 5 minutes or more
  }

  throw new Error(
    `Error checking channel idle status: ${data.error_code} ${data.description}`
  );
}

const getVideoId = async (videoName) => {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendDocument`;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  const filePath = path.join(__dirname, "media", videoName);

  const formData = new FormData();
  formData.append("chat_id", chatId);
  formData.append("document", fs.createReadStream(filePath));

  axios
    .post(url, formData)
    .then((data) => console.log(data.data.result.video.file_id))
    .catch((error) => console.error(error));
};

// getVideoId("intro-vid.mp4");
exports.sendToBot = sendToBot;
exports.sendIdleMessage = sendIdleMessage;
exports.isChannelIdle = isChannelIdle;
