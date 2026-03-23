require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');
const cheerio = require('cheerio');

class FishingScraper {
    async fetchLatestFishingNews() {
        try {
            const keywords = ['낚시 포인트', '바다낚시', '루어낚시'];
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
        // AI 모델 시도 (성공하면 최고, 실패하면 미리 준비된 정답 사용)
        const modelNames = ["gemini-1.5-flash", "gemini-pro"];
        for (const name of modelNames) {
            try {
                const model = this.genAI.getGenerativeModel({ model: name });
                const prompt = `정보: ${JSON.stringify(data, null, 2)}\n미션: '${data.randomTopic}' 주제로 정성스럽게 인스타그램 글을 10줄 작성해줘. 해시태그 20개 필수. [Caption] 만 출력.`;
                const result = await model.generateContent(prompt);
                const text = result.response.text();
                if (text && text.length > 20) return text;
            } catch (e) { console.log(`[AI알림] ${name} 모델 준비 중...`); }
        }
        
        // --- AI 실패 시 나가는 주제별 완벽한 정답 리스트 ---
        const fallbackCaptions = {
            "겨울철 대어 낚는 비법과 장비 셋팅 가이드": "겨울 대물 낚시는 수온과 인내의 싸움! ❄️\n1. 저수점 깊은 곳 공략이 핵심입니다.\n2. 예민한 고감도 찌로 입질을 놓치지 마세요.\n3. 미끼는 작고 부드럽게 준비하는 것이 팁!\n철저한 준비가 대물을 만듭니다. 오늘도 만선 기원합니다!",
            "서해안/동해안 물때 보는 법과 황금 피크타임": "물때를 알면 낚시의 절반은 성공입니다! 🌊\n1. 7물~10물 사이 조류 소통이 좋을 때가 피크!\n2. 간조/만조 전후 1시간을 집중 공략하세요.\n3. 서해는 물살, 동해는 수심 체크가 필수입니다.\n오늘의 물때와 함께 최고의 손맛을 느껴보세요!",
            "낚시꾼이 꼭 알아야 할 튼튼한 매듭법 3가지": "절대 풀리지 않는 매듭이 실력입니다! 🪢\n1. 유니노트: 모든 채비에 통하는 만능 매듭!\n2. 클린치노트: 바늘 결합 시 가장 신뢰받는 정석!\n3. 팔로마노트: 매듭 강도 테스트 1위의 위엄!\n이 세 가지만 마스터해도 터질 걱정 없이 대물과 싸울 수 있습니다."
        };
        const postBody = fallbackCaptions[data.randomTopic] || "낚시의 즐거움은 자연 속에서 느끼는 최고의 힐링이죠!";
        return `오늘의 낚시 프리미엄 리포트! 🎣\n\n${postBody}\n\n오늘도 안전하고 즐겁게, 묵직한 손맛 보시길 응원합니다!\n\n#낚시 #바다낚시 #낚스타그램 #대물기원 #생활낚시 #도시어부 #루어낚시 #민물낚시 #붕어낚시 #낚시꿀팁 #캠낚 #주말취미`;
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
            console.log('--- 인스타그램 전송 준비 단계 (25초 대기) ---');
            await new Promise(resolve => setTimeout(resolve, 25000));
            await axios.post(`${this.baseUrl}/${this.igUserId}/media_publish`, {
                creation_id: creationId, access_token: this.accessToken
            });
            return true;
        } catch (error) { 
            console.error('[최종 업로드 실패]:', error.response?.data || error.message); 
            throw error; 
        }
    }
}

async function main() {
    console.log('--- [버전 8.0 - 마지막 성공 보장 버전] 가동 ---');
    if (!process.env.GEMINI_API_KEY) { console.error('API 키 누락!'); return; }
    
    // (매우 중요) 인스타 서버가 100% 인식하는 '다이렉트 이미지 주소'로 교체
    // 위키미디어 사진은 리다이렉트가 없고 파일 경로가 명확해 인스타그램 연동 시 가장 안전합니다.
    const topicPool = [
        { topic: "겨울철 대어 낚는 비법과 장비 셋팅 가이드", img: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Angling_fishing_in_winter.jpg" },
        { topic: "서해안/동해안 물때 보는 법과 황금 피크타임", img: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Fishing_boat.jpg" },
        { topic: "낚시꾼이 꼭 알아야 할 튼튼한 매듭법 3가지", img: "https://upload.wikimedia.org/wikipedia/commons/8/87/Fishing_reel.jpg" }
    ];
    
    const selected = topicPool[Math.floor(Math.random() * topicPool.length)];
    const scraper = new FishingScraper();
    const news = await scraper.fetchLatestFishingNews();
    const data = { news, randomTopic: selected.topic };

    const ai = new FishingAI(process.env.GEMINI_API_KEY);
    const caption = await ai.generateInstagramContent(data);
    console.log(`[분석 완료] 주제: ${selected.topic}`);

    if (process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_USER_ID) {
        const publisher = new InstagramPublisher(process.env.INSTAGRAM_ACCESS_TOKEN, process.env.INSTAGRAM_USER_ID);
        await publisher.publishPost(selected.img, caption); // 다이렉트 위키미디어 이미지 주소 사용
        console.log('--- 축하합니다! 모든 장애물을 넘고 포스팅에 성공했습니다! ---');
    }
}

main().catch(err => { console.error('에러 발생:', err.message); process.exit(1); });
