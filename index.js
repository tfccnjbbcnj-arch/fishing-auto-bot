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
        // 🚀 모델 인식 문제를 해결하기 위해 가장 흔한 6가지 조합을 시도합니다.
        const modelNames = [
            "gemini-1.5-flash", "gemini-1.5-flash-001", "gemini-pro", 
            "models/gemini-1.5-flash", "models/gemini-pro", "gemini-1.0-pro"
        ];
        
        for (const name of modelNames) {
            try {
                console.log(`[AI] '${name}' 모델로 생성 시도 중...`);
                const model = this.genAI.getGenerativeModel({ model: name });
                const prompt = `정보: ${JSON.stringify(data, null, 2)}\n미션: '${data.randomTopic}' 주제로 정성스러운 인스타그램 게시글 10줄 작성. 해시태그 20개. [Caption] 만 출력.`;
                const result = await model.generateContent(prompt);
                return result.response.text();
            } catch (e) { 
                console.log(`[AI알림] ${name} 모델 사용 불가: ${e.message.substring(0, 50)}...`); 
            }
        }
        
        // AI 모두 실패 시 주제별로 준비된 정성스러운 답변
        const fallbackCaptions = {
            "겨울철 대어 낚는 비법과 장비 셋팅 가이드": "겨울 대물 낚시는 수온과의 싸움! ❄️\n1. 저수지 깊은 포인트를 공략하세요.\n2. 예민한 찌 맞춤만이 입질을 읽어냅니다.\n3. 미끼는 최대한 부드럽게 준비하세요.\n정성이 깃든 채비에만 대물이 찾아옵니다!",
            "서해안/동해안 물때 보는 법과 황금 피크타임": "물때를 알면 꽝 없는 출조가 가능합니다! 🌊\n1. 7물에서 10물 조류 흐름이 좋은 때가 피크!\n2. 간조와 만조 전후 1시간 황금 시간대를 사수하세요.\n3. 물살의 흐름을 읽는 자가 대물을 낚습니다!",
            "낚시꾼이 꼭 알아야 할 튼튼한 매듭법 3가지": "매듭 하나가 대어와 꽝을 결정합니다! 🪢\n1. 유니노트: 어떤 상황에서도 든든한 기본 매듭\n2. 클린치노트: 바늘 결합 시 가장 신뢰받는 방법\n3. 팔로마노트: 강도 면에서 따라올 수 없는 최강자\n이 3가지만 익히면 대물도 걱정 없습니다!"
        };
        const postBody = fallbackCaptions[data.randomTopic] || "낚시의 즐거움은 자연 속에서 느끼는 최고의 힐링이죠!";
        return `오늘의 낚시 전문 정보! 🎣\n\n${postBody}\n\n오늘도 안전하고 즐겁게, 묵직한 손맛 보시길 응원합니다!\n\n#낚시 #바다낚시 #낚스타그램 #대물기원 #생활낚시 #도시어부 #루어낚시 #민물낚시 #붕어낚시 #캠낚 #주말취미`;
    }
}

class InstagramPublisher {
    constructor(accessToken, igUserId) {
        this.accessToken = accessToken; this.igUserId = igUserId;
        this.baseUrl = `https://graph.facebook.com/v20.0`;
    }
    async publishPost(imageUrl, caption) {
        try {
            console.log(`[업로드] 다음 주소의 이미지를 전송합니다: ${imageUrl}`);
            const res = await axios.post(`${this.baseUrl}/${this.igUserId}/media`, {
                image_url: imageUrl, caption: caption, access_token: this.accessToken
            });
            const creationId = res.data.id;
            console.log('--- 미디어 처리 대기 (30초) ---');
            await new Promise(resolve => setTimeout(resolve, 30000));
            await axios.post(`${this.baseUrl}/${this.igUserId}/media_publish`, {
                creation_id: creationId, access_token: this.accessToken
            });
            return true;
        } catch (error) { 
            console.error('[업로드 에러 상세]:', error.response?.data || error.message); 
            throw error; 
        }
    }
}

async function main() {
    console.log('--- [버전 9.0 - 최종 해결 보장] 가동 시작 ---');
    if (!process.env.GEMINI_API_KEY) { console.error('API 키 누락!'); return; }
    
    // 🎣 인스타그램 서버가 가장 좋아하고 가벼운 Imgur 다이렉트 주소로 교체
    const topicPool = [
        { topic: "겨울철 대어 낚는 비법과 장비 셋팅 가이드", img: "https://i.imgur.com/GzB9B7N.jpg" }, // 낚시꾼 사진
        { topic: "서해안/동해안 물때 보는 법과 황금 피크타임", img: "https://i.imgur.com/L8tY9x3.jpg" }, // 바다 배경
        { topic: "낚시꾼이 꼭 알아야 할 튼튼한 매듭법 3가지", img: "https://i.imgur.com/vH9FhIe.jpg" }  // 낚시장비 사진
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
        console.log('--- 축하합니다! 드디어 포스팅에 성공했습니다! ---');
    }
}

main().catch(err => { console.error('최종 실패:', err.message); process.exit(1); });
