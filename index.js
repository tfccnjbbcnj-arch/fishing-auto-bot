require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');
const cheerio = require('cheerio');

class FishingScraper {
    async fetchLatestFishingNews() {
        try {
            const keywords = ['바다낚시 꿀팁', '루어낚시 포인트'];
            const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
            const encodedKeyword = encodeURIComponent(randomKeyword);
            const url = `https://search.naver.com/search.naver?where=news&query=${encodedKeyword}&sort=1`;
            const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const $ = cheerio.load(data);
            const newsItems = [];
            $('.news_tit').each((i, el) => {
                if (i < 2) newsItems.push({ title: $(el).text().trim(), link: $(el).attr('href') });
            });
            return newsItems;
        } catch (error) { return []; }
    }
}

class FishingAI {
    constructor(apiKey) { this.genAI = new GoogleGenerativeAI(apiKey); }
    async generateInstagramContent(data) {
        const modelNames = ["gemini-1.5-flash", "gemini-pro"];
        for (const name of modelNames) {
            try {
                const model = this.genAI.getGenerativeModel({ model: name });
                const result = await model.generateContent(`주제 '${data.randomTopic}'로 인스타그램 게시물 작성. 10줄 이내. 낚시 꿀팁 포함. 태그 20개 필수. [Caption] 만 출력.`);
                const text = result.response.text();
                if (text && text.length > 50) return text;
            } catch (e) { console.log(`[AI] ${name} 준비 중...`); }
        }
        return `오늘의 낚시 프리미엄 리포트! 🎣\n\n오늘은 '${data.randomTopic}'에 대해 알아볼까요? 낚시는 준비하는 과정부터가 설렘의 시작입니다! 오늘도 안전하고 즐거운 손맛 보시길 기원합니다!\n\n#낚시 #바다낚시 #낚스타그램 #대물기원 #생활낚시 #도시어부 #루어낚시 #민물낚시 #붕어낚시 #낚시꿀팁 #취미 #힐링`;
    }
}

class InstagramPublisher {
    constructor(accessToken, igUserId) {
        this.accessToken = accessToken; this.igUserId = igUserId;
        this.baseUrl = `https://graph.facebook.com/v20.0`;
    }
    async publishPost(imageUrl, caption) {
        try {
            console.log(`[시도] 전송 이미지: ${imageUrl}`);
            const res = await axios.post(`${this.baseUrl}/${this.igUserId}/media`, {
                image_url: imageUrl, caption: caption, access_token: this.accessToken
            });
            const creationId = res.data.id;
            console.log('--- 전송 준비 중 (30초 대기) ---');
            await new Promise(resolve => setTimeout(resolve, 30000));
            await axios.post(`${this.baseUrl}/${this.igUserId}/media_publish`, {
                creation_id: creationId, access_token: this.accessToken
            });
            return true;
        } catch (error) { console.error('[오류 상세]:', error.response?.data || error.message); throw error; }
    }
}

async function main() {
    console.log('--- [버전 13.0 - 이미지 보안 강화 버전] 가동 ---');
    
    // 🎣 주소가 변하지 않는 위키미디어 공용 저장소의 100% 낚시 사진만 사용
    // 이 사진들은 전 세계 백과사전에서 사용하는 이미지로 내용이 바뀔 염려가 없습니다.
    const topicPool = [
        { 
            topic: "겨울철 대어 낚는 비법과 장비 셋팅 가이드", 
            img: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Angling_fishing_on_the_Kiamari_jetty%2C_Karachi.webp/1024px-Angling_fishing_on_the_Kiamari_jetty%2C_Karachi.webp" // 낚시꾼 실제 전경
        },
        { 
            topic: "서해안/동해안 물때 보는 법과 황금 피크타임", 
            img: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Fishing_boat.jpg/1024px-Fishing_boat.jpg" // 바다 위 낚시배
        },
        { 
            topic: "낚시꾼이 꼭 알아야 할 튼튼한 매듭법 3가지", 
            img: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Fishing_reel.jpg/1024px-Fishing_reel.jpg" // 낚시 릴 확대샷
        }
    ];
    
    const selected = topicPool[Math.floor(Math.random() * topicPool.length)];
    const scraper = new FishingScraper();
    const news = await scraper.fetchLatestFishingNews();
    const data = { news, randomTopic: selected.topic };

    const ai = new FishingAI(process.env.GEMINI_API_KEY);
    const caption = await ai.generateInstagramContent(data);
    console.log(`[분석] 오늘의 주제: ${selected.topic}`);

    if (process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_USER_ID) {
        const publisher = new InstagramPublisher(process.env.INSTAGRAM_ACCESS_TOKEN, process.env.INSTAGRAM_USER_ID);
        // 선정적인 사진이 나올 수 없는 주소로 강제 고정 전송
        await publisher.publishPost(selected.img, caption); 
        console.log('--- 축하합니다! 보완된 버전 13.0 포스팅 성공 ---');
    }
}

main().catch(err => { console.error('실패:', err.message); process.exit(1); });
