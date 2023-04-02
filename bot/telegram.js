function sendToBot(data) {
  const winnerText = data.winner
    ? `🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆


🐉🐉 __*WE HAVE A WINNER*__ 🐉🐉
*Chances of winning*: *${data.lottery_percentage}*%

🐉🏆Congratulations\\! You won the lottery and have been rewarded with ${data.eth} ETH\\($${data.usd}\\)
        `
    : `😣😣😣😣😣😣😣😣😣😣😣😣😣

Not a winner
Try again or head to the Camelot's Nitro Pool to earn ETH rewards`;

  const bodyText = `
*Current Jackpot:* ${data.current_jackpot}
*Next Jackpot:* ${data.next_jackpot}
*Nitro Pool rewards for next epoch:* ${data.nitro_pool_rewards}

*Chances of Winning:* ${data.lottery_percentage}%

*Paid:* ${data.eth} ETH
*Bought:* ${data.no_rush} RUSH
*Price:* $${data.usd}
*Market Cap:* ${data.marketcap}
        `;
  const footerText = `
*[👤Buyer](https://arbiscan.io/address/${data.buyer_address})* \\| *[🧾Transaction](https://arbiscan.io/tx/${data.transaction_hash})*

*[💬Telegram](https://t.me/arbirushcasino)* \\| *[💻Website](https://arbirush.com)*
*[🐦Twitter](https://twitter.com/arbirushcasino)* \\| *[📈Chart](https://www.dextools.io/app/en/arbitrum/pair-explorer/0xeb034303a3c4380aa78b14b86681bd0be730de1c)*

*[💰Buy $RUSH Here](https://app.camelot.exchange/?token2=0xb70c114B20d1EE068Dd4f5F36E301d0B604FEC18)*
        `;
  const params = {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    text: `
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
        "/sendMessage",
      params,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    .then((res) => {
      console.log("Telegram message sent", res.data);
    })
    .catch((err) => {
      console.log("Telegram message not sent");
      console.log(err);
    });
}

exports.sendToBot = sendToBot;
