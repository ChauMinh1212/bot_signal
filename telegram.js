import axios from "axios";

export async function sendTelegramMessage(message, telegramApiToken, telegramChatId) {
    const telegramApiUrl = `https://api.telegram.org/bot${telegramApiToken}/sendMessage`;
    
    try {
        await axios.post(telegramApiUrl, {
            chat_id: telegramChatId,
            text: message,
            parse_mode: 'Markdown'
        });
        console.log('Đã gửi tin nhắn tới Telegram:', message);
    } catch (error) {
        console.error('Lỗi khi gửi tin nhắn Telegram:', error);
    }
}