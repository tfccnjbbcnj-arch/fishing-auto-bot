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
        // AI 모델 콤보 시도로 404 에러 방지
        const modelNames = ["gemini-1.5-flash", "gemini-pro"];
        for (const name of modelNames) {
            try {
                const model = this.genAI.getGenerativeModel({ model: name });
                const result = await model.generateContent(`주제 '${data.randomTopic}'로 인스타그램 게시물 작성. 10줄 이상. 낚시 꿀팁 포함. 태그 20개 필수. [Caption] 만 출력.`);
                const text = result.response.text();
                if (text && text.length > 50) return text;
            } catch (e) { console.log(`[AI] ${name} 준비 중...`); }
        }
        return `오늘의 낚시 프리미엄 리포트! 🎣\n\n'${data.randomTopic}'에 대한 상세한 가이드입니다. 낚시는 장비 수납부터 채비 준비까지 정성이 절반이죠! 오늘도 안전하고 즐거운 손맛 보시길 응원합니다!\n\n#낚시 #바다낚시 #낚스타그램 #대물기원 #생활낚시 #도시어부 #루어낚시 #민물낚시 #붕어낚시 #낚시꿀팁 #취미 #힐링`;
    }
}

class InstagramPublisher {
    constructor(accessToken, igUserId) {
        this.accessToken = accessToken; this.igUserId = igUserId;
        this.baseUrl = `https://graph.facebook.com/v20.0`;
    }
    async publishPost(imageUrl, caption) {
        try {
            // 인스타그램이 좋아하는 비율과 형식을 강제한 주소 전송
            const res = await axios.post(`${this.baseUrl}/${this.igUserId}/media`, {
                image_url: imageUrl, caption: caption, access_token: this.accessToken
            });
            const creationId = res.data.id;
            console.log('--- 전송 준비 (30초 대기) ---');
            await new Promise(resolve => setTimeout(resolve, 30000));
            await axios.post(`${this.baseUrl}/${this.igUserId}/media_publish`, {
                creation_id: creationId, access_token: this.accessToken
            });
            return true;
        } catch (error) { console.error('[오류 상세]:', error.response?.data || error.message); throw error; }
    }
}

async function main() {
    console.log('--- [버전 15.0 - 진정한 무인 자동화] 가동 시작 ---');
    
    // 🎣 봇이 자동으로 골라쓰는 검증된 낚시 전용 사진 리스트 (절대 엉뚱한 사진 없음)
    const images = {
        sea: "https://images.pexels.com/photos/731706/pexels-photo-731706.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080", // 바다/배
        fish: "https://images.pexels.com/photos/2131910/pexels-photo-2131910.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080", // 물고기
        gear: "https://images.pexels.com/photos/206064/pexels-photo-206064.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080", // 낚시장비
        lure: "https://images.pexels.com/photos/294674/pexels-photo-294674.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080"   // 루어/미끼
    };

    const topicPool = [
        { topic: "겨울철 대어 낚는 비법과 장비 셋팅 가이드", type: 'fish' },
        { topic: "서해안/동해안 물때 보는 법과 황금 피크타임", type: 'sea' },
        { topic: "낚시꾼이 꼭 알아야 할 튼튼한 매듭법 3가지", type: 'gear' },
        { topic: "대물을 유혹하는 루어 선택과 운영 노하우", type: 'lure' }
    ];
    
    const selected = topicPool[Math.floor(Math.random() * topicPool.length)];
    const imageUrl = images[selected.type]; // 주제에 맞는 사진을 봇이 스스로 선택

    const scraper = new FishingScraper();
    const news = await scraper.fetchLatestFishingNews();
    const data = { news, randomTopic: selected.topic };

    const ai = new FishingAI(process.env.GEMINI_API_KEY);
    const caption = await ai.generateInstagramContent(data);
    console.log(`[분석] 오늘의 주제: ${selected.topic}`);

    if (process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_USER_ID) {
        const publisher = new InstagramPublisher(process.env.INSTAGRAM_ACCESS_TOKEN, process.env.INSTAGRAM_USER_ID);
        await publisher.publishPost(imageUrl, caption); 
        console.log('--- 축하합니다! 완전 자동화 포스팅 성공! ---');
    }
}

main().catch(err => { console.error('실패:', err.message); process.exit(1); });
