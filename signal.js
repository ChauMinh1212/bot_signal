import axios from 'axios'
import 'dotenv/config'
import ti from 'technicalindicators'
import { sendTelegramMessage } from './telegram.js'
import { TICKER_WITH_MA } from "./ticker.js"

export const firstRun = async () => {
    let index = 0
    for (const item of TICKER_WITH_MA) {
        const prices = await getPrice(item.ticker)
        const ma = calMA(prices, item.ma)

        const { position, lastMA, lastPrice } = backTest(ma, prices)
        TICKER_WITH_MA[index] = {
            ...item,
            position,
            lastMA, lastPrice
        }
        index++
    }
}

export const runBot = async () => {
    let index = 0
    for (const item of TICKER_WITH_MA) {
        const prices = await getPrice(item.ticker)
        const ma = calMA(prices, item.ma)

        const nowPrices = prices[prices.length - 1]
        const nowMA = ma[ma.length - 1]

        //Cắt lên
        if (nowPrices > nowMA && item.lastPrice < item.lastMA && item.position == null) {
            //Gửi tele cắt lên
            await sendTelegramMessage({
                message: `${item.ticker} cắt lên đường MA-${item.ma} với chart ${process.env.PERIOD} giá hiện tại ${nowPrices}`,
                chatId: process.env.TELEGRAM_GROUP_ID
            })

            //Sửa lại TICKER_WITH_MA
            TICKER_WITH_MA[index] = {
                ...item,
                position: 'long',
                lastPrice: item.lastPrice,
                lastMA: item.lastMA,
            }
        }

        //Cắt xún
        if (nowPrices < nowMA && item.lastPrice > item.lastMA && item.position == 'long') {
            //Gửi tele cắt xún
            await sendTelegramMessage({
                message: `${item.ticker} cắt xuống đường MA-${item.ma} với chart ${process.env.PERIOD} giá hiện tại ${nowPrices}`,
                chatId: process.env.TELEGRAM_GROUP_ID
            })

            //Sửa lại TICKER_WITH_MA
            TICKER_WITH_MA[index] = {
                ...item,
                position: null,
                lastPrice: item.lastPrice,
                lastMA: item.lastMA,
            }
        }

        index++
    }
}

//Tính MA
const calMA = (listPrice, period) => {
    return ti.SMA.calculate({ period, values: listPrice });
}

//Lấy giá
const getPrice = async (symbol) => {
    try {
        const { data } = await axios.get(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${process.env.PERIOD}&limit=300`);
        return data.map(item => parseFloat(item[4])) //return closePrice
    } catch (e) {
        console.log('Get price error');
    }
}

//Back test
const backTest = (listMA, listPrice) => {
    const a = listPrice.length - listMA.length
    let position = null

    //Đi từ dưới lên nếu 
    for (let i = 0; i <= listMA.length - 1; i++) {
        const nowMA = listMA[i]
        const preMA = listMA[i - 1]

        const nowPrice = listPrice[i + a]
        const prePrice = listPrice[i + a - 1]

        if (!preMA) continue
        if (nowPrice > nowMA && prePrice < preMA && position == null) {
            position = 'long'
        }
        if (nowPrice < nowMA && prePrice > preMA && position == 'long') {
            position = null
        }
    }
    return {
        position,
        lastPrice: listPrice[listPrice.length - 1],
        lastMA: listMA[listMA.length - 1],
    }
}

firstRun()



