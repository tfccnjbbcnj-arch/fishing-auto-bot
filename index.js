require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');
const cheerio = require('cheerio');

class FishingScraper {
    async fetchLatestFishingNews() {
        try {
            const keywords = ['낚시 포인트', '바다낚시 꿀팁', '대물 낚시'];
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
        try {
            // 가장 안정적인 모델명 'gemini-1.5-flash' 사용
            const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `
            오늘의 낚시 정보: ${JSON.stringify(data, null, 2)}
            
            [미션]
            1. 주제: '${data.randomTopic}'에 대해 베테랑 낚시꾼으로서 아주 상세하게(10줄 이상) 설명해줘.
            2. 특히 '${data.randomTopic}'의 핵심 내용(예: 방법 3가지 등)을 반드시 포함해서 작성할 것.
            3. 해시태그 20개 포함. 오직 [Caption] 내용만 출력.
            `;
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (error) { 
            console.error('[AI에러 발생]:', error.message);
            // ⚠️ AI 실패 시 주제별로 준비된 '완벽한 정답'을 내보냅니다.
            const fallbackCaptions = {
                "겨울철 대어 낚는 비법과 장비 셋팅 가이드": "겨울 대물 낚시는 수온 체크가 핵심! 🎣\n1. 저수점 깊은 곳 공략\n2. 예민한 고감도 찌 사용\n3. 미끼는 작고 부드럽게!\n장비 셋팅만 잘해도 절반은 성공입니다.",
                "낚싯대와 릴의 수명을 늘리는 올바른 관리 기술": "소중한 장비, 오래 쓰는 법! 🛠️\n1. 낚시 후 미온수로 염분 제거\n2. 릴 전용 구리스 정기 주입\n3. 직사광선 피해서 보관\n장비 관리가 곧 실력입니다!",
                "서해안/동해안 물때 보는 법과 황금 피크타임": "물때만 잘 봐도 꽝은 없다! 🌊\n1. 7물~10물 사이를 노리세요\n2. 간조/만조 전후 1시간이 황금 타임\n3. 조류 소통이 좋은 곳이 포인트입니다.",
                "어종별 챔질 타이밍과 손맛 느끼는 기술": "입질인가? 챔질의 기술! 🐟\n1. 찌가 쑥 들어갈 때까지 참기\n2. 팔 전체로 짧고 강하게!\n3. 릴링은 천천히 일정한 속도로\n오늘도 묵직한 손맛 보시길 바랍니다!",
                "낚시꾼이 꼭 알아야 할 튼튼한 매듭법 3가지": "절대 끊어지지 않는 매듭법 3가지! 🪢\n1. 유니노트(가장 기본)\n2. 클린치 노트(바늘 결합용)\n3. 팔로마 노트(강도 최강)\n이 3가지만 알면 대물도 걱정 없습니다!"
            };
            const postBody = fallbackCaptions[data.randomTopic] || "낚시의 진정한 매력은 자연 속에서 느끼는 한 번의 강력한 손맛이죠!";
            return `오늘의 낚시 꿀팁! 🎣\n\n${postBody}\n\n오늘도 대물의 기운이 함께하시길 바라며 즐거운 출조 되세요!\n\n#낚시 #바다낚시 #낚스타그램 #대물기원 #생활낚시 #도시어부 #루어낚시 #민물낚시 #붕어낚시 #매듭법`;
        }
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
            console.log('--- 전송 준비 중 (20초 대기) ---');
            await new Promise(resolve => setTimeout(resolve, 20000));
            await axios.post(`${this.baseUrl}/${this.igUserId}/media_publish`, {
                creation_id: creationId, access_token: this.accessToken
            });
            return true;
        } catch (error) { console.error('[업로드 에러]:', error.response?.data || error.message); throw error; }
    }
}

async function main() {
    console.log('--- [버전 6.0 - 대물 만선 버전] 가동 시작 ---');
    if (!process.env.GEMINI_API_KEY) { console.error('API 키 누락!'); return; }
    
    // 주제와 어울리는 확실한 이미지 매칭
    const topicPool = [
        { topic: "겨울철 대어 낚는 비법과 장비 셋팅 가이드", img: "https://images.pexels.com/photos/2131910/pexels-photo-2131910.jpeg" },
        { topic: "낚싯대와 릴의 수명을 늘리는 올바른 관리 기술", img: "https://images.pexels.com/photos/2131911/pexels-photo-2131911.jpeg" },
        { topic: "서해안/동해안 물때 보는 법과 황금 피크타임", img: "https://images.unsplash.com/photo-1499242015907-fd91d9d0c72d?q=80&w=1080&auto=format&fit=crop" },
        { topic: "어종별 챔질 타이밍과 손맛 느끼는 기술", img: "https://images.pexels.com/photos/1630039/pexels-photo-1630039.jpeg" },
        { topic: "낚시꾼이 꼭 알아야 할 튼튼한 매듭법 3가지", img: "https://images.pexels.com/photos/206064/pexels-photo-206064.jpeg" }
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
        console.log('--- 축하합니다! 버전 6.0 포스팅 성공 ---');
    }
}

main().catch(err => { console.error('최종 실패:', err.message); process.exit(1); });
