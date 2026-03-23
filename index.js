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
    constructor(apiKey) { 
        this.genAI = new GoogleGenerativeAI(apiKey); 
    }
    async generateInstagramContent(data) {
        const modelNames = ["gemini-1.5-flash", "gemini-pro"];
        for (const name of modelNames) {
            try {
                const model = this.genAI.getGenerativeModel({ model: name });
                const result = await model.generateContent(`주제 '${data.randomTopic}'로 인스타그램 장문 게시글 작성. 10줄 이상. 낚시 실전 꿀팁 포함. 태그 20개 필수. [Caption] 만 출력.`);
                const text = result.response.text();
                if (text && text.length > 50) return text;
            } catch (e) { console.log(`[AI알림] ${name} 모델 준비 중...`); }
        }
        
        const fallbacks = {
            "겨울철 대어 낚는 비법과 장비 셋팅 가이드": "겨울 대물 낚시 비결! ❄️\n1. 깊은 수심층 공략\n2. 예민한 찌맞춤\n3. 미끼는 작고 부드럽게!\n철저한 준비가 조과를 결정합니다.",
            "서해안/동해안 물때 보는 법과 황금 피크타임": "물때가 곧 실력입니다! 🌊\n1. 7물~10물 사이가 최고의 골든 타임!\n2. 간/만조 전후 1시간 집중 공략\n3. 지역별 유속 체크는 필수!\n바다의 흐름을 읽으세요.",
            "낚시꾼이 꼭 알아야 할 튼튼한 매듭법 3가지": "절대 안 끊어지는 매듭 3종! 🪢\n1. 유니노트(전천후 만능)\n2. 클린치노트(바늘결합 정석)\n3. 팔로마노트(최강의 인장강도)\n매듭 하나가 대어를 결정합니다!"
        };
        const postBody = fallbacks[data.randomTopic] || "오늘도 대물의 손맛을 느끼는 행복한 하루 되세요!";
        return `오늘의 프리미엄 낚시 정보! 🎣\n\n${postBody}\n\n오늘도 안전하고 즐거운 출조 되시길 기원합니다!\n\n#낚시 #바다낚시 #낚스타그램 #대물기원 #생활낚시 #도시어부 #루어낚시 #민물낚시 #붕어낚시 #낚시꿀팁 #주말취미 #힐링`;
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
            console.log('--- 전송 준비 (30초 대기) ---');
            await new Promise(resolve => setTimeout(resolve, 30000));
            await axios.post(`${this.baseUrl}/${this.igUserId}/media_publish`, {
                creation_id: creationId, access_token: this.accessToken
            });
            return true;
        } catch (error) { console.error('[오류]:', error.response?.data || error.message); throw error; }
    }
}

async function main() {
    console.log('--- [버전 11.0 - 새 이미지 완전 작별] 가동 ---');
    
    // (완벽검증) 새나 꽃이 섞여 나올 수 없는 근접 촬영 사진 리스트
    const topicPool = [
        { topic: "겨울철 대어 낚는 비법과 장비 셋팅 가이드", img: "https://images.pexels.com/photos/2131910/pexels-photo-2131910.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080" }, // 물고기 접사
        { topic: "서해안/동해안 물때 보는 법과 황금 피크타임", img: "https://images.pexels.com/photos/1113926/pexels-photo-1113926.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080" }, // 찌와 물결
        { topic: "낚시꾼이 꼭 알아야 할 튼튼한 매듭법 3가지", img: "https://images.pexels.com/photos/2131911/pexels-photo-2131911.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080" }  // 낚시장비 접사
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
        await publisher.publishPost(selected.img, caption); 
        console.log('--- 축하합니다! 버전 11.0 포스팅 성공 ---');
    }
}

main().catch(err => { console.error('실패:', err.message); process.exit(1); });
