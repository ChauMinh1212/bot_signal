import { TICKER_WITH_MA } from "./ticker.js";
import { tradeFutures } from "./trade.js";
import cron from 'node-cron'
import 'dotenv/config'
import { sendTelegramMessage } from "./telegram.js";

async function runBot() {
    // await sendTelegramMessage(
    //     'Đang scan',
    //     process.env.TELEGRAM_BOT_TOKEN,
    //     process.env.TELEGRAM_GROUP_ID
    // )
    for(let i=0; i <= TICKER_WITH_MA.length - 1; i++){
        await tradeFutures(TICKER_WITH_MA[i].ticker, TICKER_WITH_MA[i].ma, TICKER_WITH_MA[i].position)
    }
}

//Chạy lúc phút thứ 1 mỗi giờ
cron.schedule('* * * * *', () => {
    runBot();
});

