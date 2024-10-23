import axios from "axios";

export async function sendTelegramMessage({message, chatId, parseMode}) {
    const telegramApiUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    try {
        await axios.post(telegramApiUrl, {
            chat_id: chatId,
            text: message,
            parse_mode: !parseMode ? 'Markdown' : parseMode
        });
        console.log('Đã gửi tin nhắn tới Telegram:', message);
    } catch (error) {
        console.error('Lỗi khi gửi tin nhắn Telegram:', error);
    }
}