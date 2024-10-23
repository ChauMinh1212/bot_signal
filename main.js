import 'dotenv/config';
import cron from 'node-cron';
import { listPosition } from "./listPosition.js";
import { checkNews } from "./scanNews.js";
import { firstRun, runBot } from "./signal.js";

//Chạy mỗi phút
cron.schedule('* * * * *', () => {
    runBot();
});

//Chạy mỗi 30p
cron.schedule('*/30 * * * *', () => {
    checkNews();
});

//Chay mỗi 5p
cron.schedule('*/5 * * * *', () => {
    listPosition();
});

//Chạy lần đầu
firstRun()

console.log(`Bot start with period ${process.env.PERIOD}`);


