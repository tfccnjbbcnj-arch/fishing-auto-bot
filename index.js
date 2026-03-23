require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');
const cheerio = require('cheerio');

class FishingScraper {
    async fetchLatestFishingNews() {
        try {
            const keywords = ['바다낚시', '루어낚시', '민물낚시 포인트'];
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
        // 인공지능이 실패해도 기분 좋은 글이 나가도록 설계
        const modelNames = ["gemini-1.5-flash", "gemini-pro"];
        for (const name of modelNames) {
            try {
                const model = this.genAI.getGenerativeModel({ model: name });
                const result = await model.generateContent(`주제 '${data.randomTopic}'로 인스타그램 게시물 작성. 10줄 이상. 낚시 꿀팁 포함. 태그 20개 필수. [Caption] 만 출력.`);
                const text = result.response.text();
                if (text && text.length > 50) return text;
            } catch (e) { console.log(`[AI] ${name} 준비 중...`); }
        }
        return `오늘의 낚시 프리미엄 리포트! 🎣\n\n'${data.randomTopic}'에 대해 이야기해 볼까요? 낚시는 장비를 챙길 때부터 그 설렘이 시작되는 것 같습니다. 오늘도 안전하게 출조하시고, 묵직한 대물 꼭 낚으시길 응원합니다!\n\n#낚시 #바다낚시 #낚스타그램 #대물기원 #생활낚시 #도시어부 #루어낚시 #민물낚시 #붕어낚시 #낚시꿀팁 #취미 #힐링`;
    }
}

class InstagramPublisher {
    constructor(accessToken, igUserId) {
        this.accessToken = accessToken; this.igUserId = igUserId;
        this.baseUrl = `https://graph.facebook.com/v20.0`;
    }
    async publishPost(imageUrl, caption) {
        try {
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
        } catch (error) { console.error('[오류]:', error.response?.data || error.message); throw error; }
    }
}

async function main() {
    // 🚩 이 문구가 나오는지 로그에서 꼭 확인하세요!
    console.log('--- [버전 16.0 - 진짜 찐 최종!] 가동 시작 ---');
    
    // 🎣 누가 봐도 100% 낚시인 '새롭고 확실한' 사진 주소들 (1:1 비율 정규 규격)
    const images = {
        gear_reel: "https://images.pexels.com/photos/206064/pexels-photo-206064.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080", // 낚시 릴 확대
        hand_fish: "https://images.pexels.com/photos/2131910/pexels-photo-2131910.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080", // 물고기를 든 손
        gear_lure: "https://images.pexels.com/photos/425313/pexels-photo-425313.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080", // 루어 가짜미끼
        rod_sea: "https://images.pexels.com/photos/1651475/pexels-photo-1651475.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080"   // 바다 쪽으로 뻗은 낚싯대
    };

    const topicPool = [
        { topic: "겨울철 대어 낚는 비법과 장비 셋팅 가이드", type: 'hand_fish' },
        { topic: "서해안/동해안 물때 보는 법과 황금 피크타임", type: 'rod_sea' },
        { topic: "낚시꾼이 꼭 알아야 할 튼튼한 매듭법 3가지", type: 'gear_reel' },
        { topic: "대물을 유혹하는 루어 선택과 운영 노하우", type: 'gear_lure' }
    ];
    
    const selected = topicPool[Math.floor(Math.random() * topicPool.length)];
    const imageUrl = images[selected.type];

    const scraper = new FishingScraper();
    const news = await scraper.fetchLatestFishingNews();
    const data = { news, randomTopic: selected.topic };

    const ai = new FishingAI(process.env.GEMINI_API_KEY);
    const caption = await ai.generateInstagramContent(data);
    console.log(`[분석] 오늘의 주제: ${selected.topic}`);

    if (process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_USER_ID) {
        const publisher = new InstagramPublisher(process.env.INSTAGRAM_ACCESS_TOKEN, process.env.INSTAGRAM_USER_ID);
        await publisher.publishPost(imageUrl, caption); 
        console.log('--- 축하합니다! 버전 16.0 포스팅 성공! ---');
    }
}

main().catch(err => { console.error('실패:', err.message); process.exit(1); });
