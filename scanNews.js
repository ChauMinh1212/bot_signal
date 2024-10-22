import axios from "axios";
import fs from 'fs'
import 'dotenv/config'
import { sendTelegramMessage } from "./telegram.js";


let sentArticles = [];

// Tải danh sách tin đã gửi
const loadSentArticles = () => {
    if (fs.existsSync('sentArticles.json')) {
        const data = fs.readFileSync('sentArticles.json');
        sentArticles = JSON.parse(data);
    }
};

// Lưu danh sách tin đã gửi
const saveSentArticles = () => {
    fs.writeFileSync('sentArticles.json', JSON.stringify(sentArticles));
};

// Lấy tin tức từ NewsAPI
const fetchNews = async () => {
    const url = `https://newsapi.org/v2/top-headlines?category=business&language=en&apiKey=${process.env.NEWS_API_KEY}`;
    const response = await axios.get(url);
    const data = response.data;
    return data.articles || [];
};

// Phân tích tính tích cực/tiêu cực (simple version: dựa vào từ khóa)
const analyzeSentiment = (text) => {
    const positiveKeywords = ['gain', 'growth', 'increase', 'up', 'profit'];
    const negativeKeywords = ['loss', 'decline', 'fall', 'down', 'crisis'];

    let sentiment = 'neutral';
    if (positiveKeywords.some((word) => text.includes(word))) {
        sentiment = 'positive';
    } else if (negativeKeywords.some((word) => text.includes(word))) {
        sentiment = 'negative';
    }
    return sentiment;
};

//3 tin gửi 1 lần
const sendNewsToTelegramV2 = async (listArticlesSentiment) => {
    let count = 0
    let index = 0
    const messages = []

    for (const articlesSentiment of listArticlesSentiment) {
        if (count === 3 || index == listArticlesSentiment.length - 1) {
            await sendTelegramMessage(messages.join(
                `
            ------------------------------------------------
            `
            ), process.env.TELEGRAM_BOT_TOKEN, process.env.TELEGRAM_GROUP_NEWS_ID)
            count = 0
            index++
            continue
        }

        messages[count] = `
        ${articlesSentiment.sentiment === 'positive' ? '🟢 TÍCH CỰC' : articlesSentiment.sentiment === 'negative' ? '🔴 TIÊU CỰC' : '⚪ TRUNG LẬP'}
        Tin mới: *${articlesSentiment.article.title}*
        Link: ${articlesSentiment.article.url}
        Tóm tắt: ${articlesSentiment.article.description}
        `
        count++
        index++
    }
};

// Lấy tin tức và xử lý
export const checkNews = async () => {
    loadSentArticles();

    const news = await fetchNews();
    const listArticlesSentiment = []
    for (const article of news) {
        if (!sentArticles.includes(article.url)) {
            const sentiment = analyzeSentiment(article.description || article.title);
            listArticlesSentiment.push({ article, sentiment })
            sentArticles.push(article.url); // Đánh dấu tin đã gửi
        }
    };
    try {
        await sendNewsToTelegramV2(listArticlesSentiment)
        saveSentArticles()
    } catch (e) {
        console.log('loi khi gui tin');
    }
};