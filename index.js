require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');
const cheerio = require('cheerio');

class FishingScraper {
    async fetchLatestFishingNews() {
        try {
            const keywords = ['낚시 명소', '바다낚시', '루어낚시'];
            const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
            const encodedKeyword = encodeURIComponent(randomKeyword);
            const url = `https://search.naver.com/search.naver?where=news&query=${encodedKeyword}&sort=1`;
            const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const $ = cheerio.load(data);
            const newsItems = [];
            $('.news_tit').each((i, el) => {
                if (i < 3) newsItems.push({ title: $(el).text().trim(), link: $(el).attr('href') });
            });
            return newsItems;
        } catch (error) { return []; }
    }
}

class FishingAI {
    constructor(apiKey) { this.genAI = new GoogleGenerativeAI(apiKey); }
    async generateInstagramContent(data) {
        // 🚀 모델명을 여러 개 시도하여 404 에러 원천 차단
        const modelNames = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
        for (const name of modelNames) {
            try {
                console.log(`[AI시도] 모델 ${name}으로 생성을 시도합니다...`);
                const model = this.genAI.getGenerativeModel({ model: name });
                const prompt = `정보: ${JSON.stringify(data, null, 2)}\n미션: '${data.randomTopic}' 주제로 정성스럽게 인스타그램 글을 10줄 작성해줘. 해시태그 20개 필수. [Caption] 만 출력.`;
                const result = await model.generateContent(prompt);
                return result.response.text();
            } catch (e) { console.log(`[AI알림] ${name} 모델 실패, 다음으로 넘어갑니다.`); }
        }
        
        // 모든 모델 실패 시의 주제별 풍성한 정답 가이드
        const fallbackCaptions = {
            "겨울철 대어 낚는 비법과 장비 셋팅 가이드": "겨울 대물 낚시, 수온 1도의 차이가 승패를 가릅니다! ❄️\n1. 저수점 깊은 곳을 공략하는 과감함\n2. 예민한 고감도 찌로 아주 미세한 입질까지 포착\n3. 미끼는 최대한 작고 부드러운 것으로 입 안 깊숙이!\n준비가 잘 된 낚시꾼에게는 반드시 기회가 옵니다. 오늘도 만선 기원!",
            "서해안/동해안 물때 보는 법과 황금 피크타임": "물때를 알아야 꽝 없는 낚시가 가능합니다! 🌊\n1. 7물에서 10물 사이가 가장 활발한 조류 소통!\n2. 간조와 만조 전후 1시간, 이 황금 타임을 절대 놓치지 마세요.\n3. 동해는 수심, 서해는 조류 방향이 생명입니다.\n자연의 흐름을 읽는 당신이 바로 진정한 강태공!",
            "낚시꾼이 꼭 알아야 할 튼튼한 매듭법 3가지": "매듭이 풀려서 대어를 놓치는 불상사는 이제 그만! 🪢\n1. 유니노트: 어떤 상황에서도 신뢰할 수 있는 만능 매듭\n2. 클린치노트: 바늘과 도래 결합의 정석 중의 정석\n3. 팔로마노트: 강도 면에서는 따라올 자가 없는 최강 매듭\n이 세 가지만 손에 익히면 낚시가 수월해집니다."
        };
        const postBody = fallbackCaptions[data.randomTopic] || "낚시의 즐거움은 채비를 준비하는 정성에서 시작됩니다!";
        return `오늘의 낚시 프리미엄 정보! 🎣\n\n${postBody}\n\n오늘도 안전하게 손맛 즐기시는 하루 되시길 바랍니다!\n\n#낚시 #바다낚시 #낚스타그램 #대물기원 #생활낚시 #도시어부 #루어낚시 #민물낚시 #붕어낚시 #힐링`;
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
            console.log('--- 미디어 준비 중 (20초 대기) ---');
            await new Promise(resolve => setTimeout(resolve, 20000));
            await axios.post(`${this.baseUrl}/${this.igUserId}/media_publish`, {
                creation_id: creationId, access_token: this.accessToken
            });
            return true;
        } catch (error) { console.error('[업로드 상세 에러]:', error.response?.data || error.message); throw error; }
    }
}

async function main() {
    console.log('--- [버전 7.0 - 만선 완료 버전] 가동 시작 ---');
    if (!process.env.GEMINI_API_KEY) { console.error('API 키 누락!'); return; }
    
    // 🎣 인스타 서버가 100% 인식하는 직접적인 사진 주소만 사용
    const topicPool = [
        { topic: "겨울철 대어 낚는 비법과 장비 셋팅 가이드", img: "https://images.pexels.com/photos/2131910/pexels-photo-2131910.jpeg?auto=compress&cs=tinysrgb&h=1000&w=1000" },
        { topic: "서해안/동해안 물때 보는 법과 황금 피크타임", img: "https://images.unsplash.com/photo-1544434250-9ad982739343?auto=format&fit=crop&q=80&w=1080&fm=jpg" },
        { topic: "낚시꾼이 꼭 알아야 할 튼튼한 매듭법 3가지", img: "https://images.pexels.com/photos/2131911/pexels-photo-2131911.jpeg?auto=compress&cs=tinysrgb&h=1000&w=1000" }
    ];
    
    const selected = topicPool[Math.floor(Math.random() * topicPool.length)];
    const scraper = new FishingScraper();
    const news = await scraper.fetchLatestFishingNews();
    const data = { news, randomTopic: selected.topic };

    const ai = new FishingAI(process.env.GEMINI_API_KEY);
    const caption = await ai.generateInstagramContent(data);
    console.log(`[분석] 주제: ${selected.topic}`);

    if (process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_USER_ID) {
        const publisher = new InstagramPublisher(process.env.INSTAGRAM_ACCESS_TOKEN, process.env.INSTAGRAM_USER_ID);
        await publisher.publishPost(selected.img, caption);
        console.log('--- 축하합니다! 최종 포스팅에 성공했습니다 ---');
    }
}

main().catch(err => { console.error('최종 실패:', err.message); process.exit(1); });
