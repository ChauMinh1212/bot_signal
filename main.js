import { TICKER_WITH_MA } from "./ticker.js";
import { tradeFutures } from "./trade.js";
import cron from 'node-cron'
import 'dotenv/config'
import { checkNews } from "./scanNews.js";

async function runBot() {
    for(let i=0; i <= TICKER_WITH_MA.length - 1; i++){
        await tradeFutures(TICKER_WITH_MA[i].ticker, TICKER_WITH_MA[i].ma, TICKER_WITH_MA[i].position)
    }
}

//Chạy mỗi phút
cron.schedule('* * * * *', () => {
    runBot();
});

cron.schedule('* * * * *', () => {
    checkNews();
});

console.log(`Bot start with period ${process.env.PERIOD}`);


