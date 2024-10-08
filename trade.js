import axios from 'axios';
import { SMA } from 'technicalindicators';
import { sendTelegramMessage } from './telegram.js';
import { TICKER, TICKER_WITH_MA } from './ticker.js';
// import binanceApiNode from 'binance-api-node';

// API Key và Secret từ Binance
// const apiKey = 'YOUR_BINANCE_API_KEY';
// const apiSecret = 'YOUR_BINANCE_API_SECRET';

// Kết nối đến Binance API
// const client = binance({
//   apiKey: apiKey,
//   apiSecret: apiSecret,
//   futures: true // Sử dụng futures API
// });


// Hàm tính MA dựa trên dữ liệu giá đóng cửa
function calculateMA(closingPrices, period) {
  return SMA.calculate({ period, values: closingPrices });
}

// Mua Futures khi giá cắt lên MA và đóng khi cắt xuống MA
export async function tradeFutures(symbol, maPeriod, position) {
  let entryPrice = 0;
  const index = TICKER_WITH_MA.findIndex(item => item.ticker == symbol)
  
  try {
    // Lấy dữ liệu nến gần nhất từ Binance
    const candles = await axios.get(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${process.env.PERIOD}&limit=300`);
    
    const closingPrices = candles.data.map(c => parseFloat(c[4])); // Lấy giá đóng cửa
    
    // Tính MA dựa trên giá đóng cửa
    const maValues = calculateMA(closingPrices, maPeriod);
    const currentPrice = closingPrices[closingPrices.length - 1];
    const previousPrice = closingPrices[closingPrices.length - 2];
    const currentMA = maValues[maValues.length - 1];
    const previousMA = maValues[maValues.length - 2];
    
    // Kiểm tra nếu giá cắt lên MA (mở lệnh long)
    if (previousPrice < previousMA && currentPrice > currentMA && position === null) {
      // console.log(`Mở lệnh long tại giá ${currentPrice}`);
      
      // Mở lệnh long (mua)
      // const order = await client.futuresOrder({
      //   symbol: 'BTCUSDT',
      //   side: 'BUY', // Mua
      //   type: 'MARKET',
      //   quantity: 0.001, // Số lượng BTC muốn mua
      // });
      
      entryPrice = currentPrice;
      TICKER_WITH_MA[index].position = 'long'
      // console.log(`Đã mở lệnh long tại giá ${entryPrice}`);
      await sendTelegramMessage(
        `${symbol} cắt lên đường MA-${maPeriod} với chart ${process.env.PERIOD} giá hiện tại ${currentPrice}`,
        process.env.TELEGRAM_BOT_TOKEN,
        process.env.TELEGRAM_GROUP_ID
      )
    }
    
    // Kiểm tra nếu giá cắt xuống MA (đóng lệnh long)
    if (previousPrice > previousMA && currentPrice < currentMA && position === 'long') {
      // console.log(`Đóng lệnh long tại giá ${currentPrice}`);
      
      // Đóng lệnh long (bán)
      // const order = await client.futuresOrder({
      //   symbol: 'BTCUSDT',
      //   side: 'SELL', // Bán để đóng lệnh long
      //   type: 'MARKET',
      //   quantity: 0.001, // Số lượng BTC đang giữ
      // });
      
      const profit = currentPrice - entryPrice;
      console.log(`Đã đóng lệnh long. Lợi nhuận: ${profit}`);
      TICKER_WITH_MA[index].position = null
      await sendTelegramMessage(
        `${symbol} cắt xuống đường MA-${maPeriod} với chart ${process.env.PERIOD} giá hiện tại ${currentPrice}`,
        process.env.TELEGRAM_BOT_TOKEN,
        process.env.TELEGRAM_GROUP_ID
      )
    }

  } catch (error) {
    console.error('Lỗi khi giao dịch:', error);
  }
}
