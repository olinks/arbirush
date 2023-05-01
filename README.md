# Phoenix Royale Lottery Bot
 Phoenix Royale Lottery Script and Telegram Bot

## First Deploy
If making a first time deploy, follow these steps:

**Environmental Variables**

Simply rename the existing `.env.example` file to `.env` and fill in the appropriate values.

**Database**
```bash
npm run create:db
npm run create:table
```
To create the needed database and table (this assumes you've already setup a mysql server)


## Telegram Bot Setup
To get started with the bot, you must follow these steps:

In the `media/` folder, add these three files:  
- intro-vid.mp4 (Idle Video)
- jackpot-lose.mp4 (Lose Video)
- jackpot-win.mp4 (Win Video)

Then follow the next steps to get the file ids required

> This command only needs to be run for the first time setup and if the bot api key has been changed.
```
npm run get_media_ids
```
Replace the following `.env` fields with the result you get
```.env
IDLE_VIDEO_ID=BAACAg..
WIN_VIDEO_ID=BAACAg..
LOSE_VIDEO_ID=BAACAg...
```
## Start App

**Development**
```bash
npm run dev
```

**Production**
```bash
npm run start
```