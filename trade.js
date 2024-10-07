import axios from 'axios';
import { SMA } from 'technicalindicators';
import { sendTelegramMessage } from './telegram.js';
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
export async function tradeFutures(symbol, maPeriod = 10) {
  let position = null; // null = không có lệnh, 'long' = đang mở lệnh long
  let entryPrice = 0;
  
  try {
    // Lấy dữ liệu nến gần nhất từ Binance
    const candles = await axios.get(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${process.env.PERIOD}&limit=300`);
    
    const closingPrices = candles.data.map(c => parseFloat(c[4])).slice(0, -1); // Lấy giá đóng cửa trừ giá hiện tại
    
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
      position = 'long';
      // console.log(`Đã mở lệnh long tại giá ${entryPrice}`);
      await sendTelegramMessage(
        `Vào lệnh LONG: ${symbol}`,
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
      position = null;
    }

  } catch (error) {
    console.error('Lỗi khi giao dịch:', error);
  }
}
