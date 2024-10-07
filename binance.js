export async function getTop50Ticker(){
    try {
        const res = await axios.get('https://fapi.binance.com/fapi/v1/exchangeInfo')
        const data = res.data.symbols.slice(0, 50).map(item => item.symbol)
        return data
    } catch (error) {
        console.log('Lỗi khi lấy dữ liệu', error);
    }
}

