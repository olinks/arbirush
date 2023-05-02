const axios = require("axios");
const path = require("path");
const fs = require("fs");
const FormData = require("form-data");
const logger = require("./utils/logger");

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

function generateEmojis(amount) {
  let numberOfEmojis = Math.floor(amount / 10);
  return "🔥".repeat(numberOfEmojis);
}

const inlineKeyboard = [
  [
    {
      text: "Buy ROYALE",
      url: "https://www.sushi.com/swap?fromChainId=42161&fromCurrency=0x259aF8C0989212Ad65A5fced4B976c72FBB758B9&toChainId=42161&toCurrency=NATIVE&amount=12192.930462149",
    },
    {
      text: "DexTools",
      url: "https://www.dextools.io/app/en/arbitrum/pair-explorer/0x1144bcc225335b07b1239c78e9801164c4419e38",
    },
  ],
  [
    {
      text: "Whitepaper",
      url: "https://phoenixroyale.com/whitepaper/",
    },
    {
      text: "Dexscreener",
      url: "https://dexscreener.com/arbitrum/0x1144bcc225335b07b1239c78e9801164c4419e38",
    },
  ],
];

function sendToBot(data) {
  const winnerText = data.winner
    ? `${generateEmojis(data.usd_spent)}


🏆🏆 __*WE HAVE A WINNER*__ 🏆🏆
*Chances of winning*: *${data.lottery_percentage}*%

🐉🏆Congratulations\\!
You won the lottery and have been rewarded with ${parseToMarkdown(
        data.current_jackpot.toFixed(2)
      )} ETH\\($${parseToMarkdown(
        (data.current_jackpot * data.eth_usd_price).toFixed(2)
      )}\\)
        `
    : `${generateEmojis(data.usd_spent)}

🥲Not a winner🥲
Better luck winning next time\\!🤞🏼`;

  const bodyText = `
*🥇Current Jackpot:* ${parseToMarkdown(
    data.current_jackpot.toFixed(2)
  )} ETH \\($${parseToMarkdown(
    (data.current_jackpot * data.eth_usd_price).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  )}\\)
*🥈Next Jackpot:* ${parseToMarkdown(
    data.next_jackpot.toFixed(2)
  )} ETH \\($${parseToMarkdown(
    (data.next_jackpot * data.eth_usd_price).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  )}\\)

*Chances of Winning:* ${data.lottery_percentage}%

*🧾Paid:* ${parseToMarkdown(data.eth.toFixed(4))} ETH \\($${parseToMarkdown(
    (data.eth * data.eth_usd_price).toFixed(4)
  )}\\)
*💵Bought:* ${parseToMarkdown(data.no_rush.toFixed(4))} RUSH

*💲Price:* $${parseToMarkdown(data.rush_usd)}
*💰Market Cap:* $${parseToMarkdown(
    data.marketcap.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  )}
        `;
  const footerText = `
*[👤Buyer](https://arbiscan.io/address/${data.buyer_address})* \\| *[🧾Transaction](https://arbiscan.io/tx/${data.transaction_hash})*

*[💬Telegram](https://t.me/phoenixroyalecasino)* \\| *[💻Website](https://phoenixroyale.com)*
*[🐦Twitter](https://twitter.com/phoenixroyaleL2)* \\| *[📈Chart](https://www.dextools.io/app/en/arbitrum/pair-explorer/0x1144bcc225335b07b1239c78e9801164c4419e38)*

*[💰Buy $ROYALE Here](https://www.sushi.com/swap?fromChainId=42161&fromCurrency=0x259aF8C0989212Ad65A5fced4B976c72FBB758B9&toChainId=42161&toCurrency=NATIVE&amount=12192.930462149)* \\| *[💻dApp](https://dapp.phoenixroyale.com
        `;

  const notWinnerVideo = process.env.LOSE_VIDEO_ID;
  const winnerVideo = process.env.WIN_VIDEO_ID;
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
      logger.info("Telegram message sent");
    })
    .catch((err) => {
      logger.error("Telegram message not sent", err);
    });
}

function sendIdleMessage(data) {
  const bodyText = `
*🥇Current Jackpot:* ${parseToMarkdown(
    data.current_jackpot.toFixed(4)
  )} ETH \\($${parseToMarkdown(
    (data.current_jackpot * data.eth_usd_price).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  )}\\)
*🥈Next Jackpot:* ${parseToMarkdown(
    data.next_jackpot.toFixed(4)
  )} ETH \\($${parseToMarkdown(
    (data.next_jackpot * data.eth_usd_price).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  )}\\)

*💲Price:* $${parseToMarkdown(data.rush_usd.toFixed(3))}
*💰Market Cap:* $${parseToMarkdown(
    data.marketcap.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  )}
        `;
  const footerText = `
*[💬Telegram](https://t.me/phoenixroyalecasino)* \\| *[🌐Website](https://phoenixroyale.com)*
*[🐦Twitter](https://twitter.com/phoenixroyaleL2)* \\| *[📈Chart](https://www.dextools.io/app/en/arbitrum/pair-explorer/0x1144bcc225335b07b1239c78e9801164c4419e38)*

*[💰Buy $ROYALE Here](https://www.sushi.com/swap?fromChainId=42161&fromCurrency=0x259aF8C0989212Ad65A5fced4B976c72FBB758B9&toChainId=42161&toCurrency=NATIVE&amount=12192.930462149)* \\| *[💻dApp](https://dapp.phoenixroyale.com)*
          `;
  const params = {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    video: process.env.IDLE_VIDEO_ID,
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
      logger.info("Idle Telegram message sent");
    })
    .catch((err) => {
      logger.error("Telegram message not sent", err);
    });
}

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

  return axios
    .post(url, formData)
    .then((data) => {
      return {
        [videoName]: data.data.result.video.file_id,
      };
    })
    .catch((error) => console.error(error));
};

const getAllVideoIds = async () => {
  const videos = ["intro-vid.mp4", "jackpot-lose.mp4", "jackpot-win.mp4"];
  const promiseArray = videos.map((v) => getVideoId(v));
  try {
    const result = await Promise.all(promiseArray);
    return result;
  } catch (err) {
    console.log("Error getting all video ids");
  }
};

exports.sendToBot = sendToBot;
exports.sendIdleMessage = sendIdleMessage;
exports.isChannelIdle = isChannelIdle;
exports.getAllVideoIds = getAllVideoIds;
// 