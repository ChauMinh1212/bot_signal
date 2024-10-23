import 'dotenv/config'
import crypto from 'crypto'
import axios from 'axios';
import { sendTelegramMessage } from './telegram.js';

const getListPosition = async () => {
    const timestamp = Date.now()
    const queryString = `timestamp=${timestamp}`
    const signature = crypto.createHmac('sha256', process.env.BINANCE_SECRET_KEY).update(queryString).digest('hex')

    const res = await axios.get(
        `https://fapi.binance.com/fapi/v3/positionRisk?${queryString}&signature=${signature}`,
        {
            headers: {
                'X-MBX-APIKEY': process.env.BINANCE_API_KEY
            }
        }
    )

    return res.data
}

const sendTelegram = async (listPosition) => {
    const message = listPosition.map(item => 
    `
    Mã: ${item.unRealizedProfit > 0 ? '🟢' : '🔴'} ${item.symbol}\nPNL: ${parseFloat(item.unRealizedProfit).toFixed(2)}
    `)

    await sendTelegramMessage(message.join(
    `
    -------------
    `), process.env.TELEGRAM_BOT_TOKEN, process.env.TELEGRAM_GROUP_POSITION_ID)
}

export const listPosition = async () => {
    const data = await getListPosition()
    if (data.length == 0) return
    sendTelegram(data)
}