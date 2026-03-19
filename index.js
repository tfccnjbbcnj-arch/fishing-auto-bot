const axios = require('axios');
const cheerio = require('cheerio');
const { GoogleGenerativeAI } = require("@google/generative-ai");
// --- 1. 스크래퍼 클래스 ---
class FishingScraper {
    async fetchLatestFishingNews() {
        try {
            const url = `https://search.naver.com/search.naver?where=news&query=%EB%82%9A%EC%8B%9C&sm=tab_pge&sort=1`;
            const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const $ = cheerio.load(data);
            const newsItems = [];
            $('.news_tit').each((i, el) => { if (i < 3) newsItems.push({ title: $(el).text(), link: $(el).attr('href') }); });
            return newsItems;
        } catch (e) { return []; }
    }
    async fetchSeaWeather() { return { location: "전국 주요 포인트", status: "보통", tide: "사리 전후", temp: "15.2도" }; }
    async getAllData() { 
        const news = await this.fetchLatestFishingNews();
        const weather = await this.fetchSeaWeather();
        return { news, weather };
    }
}
// --- 2. AI 콘텐츠 클래스 ---
class FishingAI {
    constructor(apiKey) { this.genAI = new GoogleGenerativeAI(apiKey); }
    async generateInstagramContent(data) {
        try {
            const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
            const prompt = `낚시 뉴스:${JSON.stringify(data.news)}와 날씨:${JSON.stringify(data.weather)} 정보를 바탕으로 인스타그램 게시물을 작성해줘. 낚시꾼 말투로 이모지와 해시태그 15개를 포함해줘. [Caption] 결과만 줘.`;
            const result = await model.generateContent(prompt);
            return (await result.response).text();
        } catch (e) { return "오늘도 즐거운 낚시 되세요! 🎣 #낚시 #바다낚시"; }
    }
}
// --- 3. 인스타그램 발행 클래스 ---
class InstagramPublisher {
    constructor(token, id) { this.token = token; this.id = id; this.baseUrl = `https://graph.facebook.com/v18.0`; }
    async publishPost(imageUrl, caption) {
        const container = await axios.post(`${this.baseUrl}/${this.id}/media`, { image_url: imageUrl, caption: caption, access_token: this.token });
        return await axios.post(`${this.baseUrl}/${this.id}/media_publish`, { creation_id: container.data.id, access_token: this.token });
    }
}
// --- 메인 실행 로직 ---
async function main() {
    console.log('--- 낚시 봇 시뮬레이션 가동 ---');
    const scraper = new FishingScraper();
    const data = await scraper.getAllData();
    
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY 누락');
    const ai = new FishingAI(process.env.GEMINI_API_KEY);
    const caption = await ai.generateInstagramContent(data);
    console.log('생성된 캡션:\n', caption);
    const imageUrl = process.env.DEFAULT_IMAGE_URL || "https://loremflickr.com/1080/1080/fishing,sea";
    if (process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_USER_ID) {
        const pub = new InstagramPublisher(process.env.INSTAGRAM_ACCESS_TOKEN, process.env.INSTAGRAM_USER_ID);
        await pub.publishPost(imageUrl, caption);
        console.log('업로드 성공!');
    } else {
        console.log('인스타그램 정보 없음 (시뮬레이션 완료)');
    }
}
main().catch(err => { console.error(err); process.exit(1); });
