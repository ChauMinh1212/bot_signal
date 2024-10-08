import axios from "axios";
import ti from 'technicalindicators'
import { TICKER } from "./ticker.js";

// Hàm lấy dữ liệu lịch sử từ Binance API
async function getHistoricalData(symbol, interval, limit) {
    const url = `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    const response = await axios.get(url);
    
    return response.data.map(candle => ({
        time: candle[0],
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5])
    }));
}

// Hàm tính MA
function calculateMA(data, period) {
    return ti.SMA.calculate({ period, values: data.map(c => c.close) });
}

// Hàm thực hiện backtest cho 1 đường MA, tính % lợi nhuận có cộng dồn
function backtestMAWithPrice(data, maPeriod) {
    const maValues = calculateMA(data, maPeriod);

    let position = null; // null = không có lệnh, 'long' = mở lệnh long
    let entryPrice = 0;
    let cumulativeProfit = 0; // Lợi nhuận cộng dồn tính theo %
    
    // Duyệt qua tất cả các giá trị sau khi MA đã được tính toán
    for (let i = maPeriod; i < data.length; i++) {
        const currentPrice = data[i].close;
        const previousPrice = data[i - 1].close;
        const currentMA = maValues[i - maPeriod];
        const previousMA = maValues[i - maPeriod - 1];

        // Kiểm tra xem giá cắt lên đường MA (mở lệnh long)
        if (previousPrice < previousMA && currentPrice > currentMA) {
            if (position === null) {
                position = 'long';
                entryPrice = currentPrice;
            }
        }

        // Kiểm tra xem giá cắt xuống đường MA (đóng lệnh)
        if (previousPrice > previousMA && currentPrice < currentMA) {
            if (position === 'long') {
                // Tính % lợi nhuận cho giao dịch hiện tại
                const profitPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
                cumulativeProfit += profitPercent;
                position = null;
            }
        }
    }

    // Nếu còn lệnh mở, đóng nó khi kết thúc (dùng giá cuối cùng)
    if (position === 'long') {
        const finalPrice = data[data.length - 1].close;
        const profitPercent = ((finalPrice - entryPrice) / entryPrice) * 100;
        cumulativeProfit += profitPercent;
    }

    return {profit: cumulativeProfit, hasSignal: !position ? false : true};
}

// Hàm tìm ra đường MA có lợi nhuận cộng dồn cao nhất khi so sánh với giá
async function findBestMA(ticker) {
    const data = await getHistoricalData(ticker, '4h', 300);

    let bestProfit = -Infinity;
    let bestMA = 0;

    for (let maPeriod = 5; maPeriod <= 100; maPeriod++) {
        const {profit, hasSignal} = backtestMAWithPrice(data.slice(0, -1), maPeriod);
        if (profit > bestProfit) {
            bestProfit = profit;
            bestMA = maPeriod;
        }
    }

    console.log(`Best MA: period=${bestMA}, cumulative profit=${bestProfit}%`);
    return {ticker, ma: bestMA, profit: bestProfit}
}

async function getTicker(){
    try {
        const res = await axios.get('https://fapi.binance.com/fapi/v1/exchangeInfo')
        const data = res.data.symbols.slice(0, 50).map(item => item.symbol)
        console.log(data);
        return data
    } catch (error) {
        console.log('Lỗi khi lấy dữ liệu', error);
    }
}

const mapped = Promise.all(TICKER.map((item) => {
    return findBestMA(item)
}))

console.log(mapped.then(res => console.log(res.sort((a, b) => b.profit - a.profit).slice(0, 40))));