import 'dotenv/config'
import crypto from 'crypto'
import axios from 'axios';
import { sendTelegramMessage } from './telegram.js';

const getListPosition = async (apiKey, secretKey) => {
    const timestamp = Date.now()
    const queryString = `timestamp=${timestamp}`
    const signature = crypto.createHmac('sha256', secretKey).update(queryString).digest('hex')

    const res = await axios.get(
        `https://fapi.binance.com/fapi/v3/positionRisk?${queryString}&signature=${signature}`,
        {
            headers: {
                'X-MBX-APIKEY': apiKey
            }
        }
    )

    return res.data
}

const sendTelegram = async (listPosition, chatId) => {
    const message = listPosition.map(item =>
    `
    Mã: ${item.unRealizedProfit > 0 ? '🟢' : '🔴'} ${item.symbol}\nPNL: ${parseFloat(item.unRealizedProfit).toFixed(2)}
    `)
    await sendTelegramMessage({
        message: message.join(
            `
            -------------
            `),
        chatId
    })
}

export const listPosition = async () => {
    const [dataAnh, dataEmbe] = await Promise.all([
        getListPosition(process.env.BINANCE_API_KEY, process.env.BINANCE_SECRET_KEY),
        getListPosition(process.env.BINANCE_API_KEY_EMBE, process.env.BINANCE_SECRET_KEY_EMBE)
    ])
    if (dataAnh.length !== 0) {
        sendTelegram(dataAnh, process.env.TELEGRAM_GROUP_POSITION_ID)
    }
    if (dataEmbe.length !== 0) {
        sendTelegram(dataEmbe, process.env.TELEGRAM_GROUP_POSITION_ID_EMBE)
    }
}

listPosition()