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
        this.apiKeyValid = apiKey && apiKey.startsWith('AIza');
    }
    async generateInstagramContent(data) {
        if (!this.apiKeyValid) console.log('[경고] AI 키 형식이 올바르지 않습니다 (AIza로 시작해야 함).');
        
        const modelNames = ["gemini-1.5-flash", "gemini-pro", "gemini-1.5-pro"];
        for (const name of modelNames) {
            try {
                const model = this.genAI.getGenerativeModel({ model: name });
                const result = await model.generateContent(`주제 '${data.randomTopic}'로 인스타그램 장문 게시글 작성. 10줄 이상. 낚시 꿀팁 포함. 태그 20개 필수. [Caption] 만 출력.`);
                const text = result.response.text();
                if (text && text.length > 50) return text;
            } catch (e) { console.log(`[AI알림] ${name} 모델 사용 불가.`); }
        }
        
        // --- AI 실패 시 나가는 주제별 완벽한 1:1 맞춤 정답 ---
        const fallbacks = {
            "겨울철 대어 낚는 비법과 장비 셋팅 가이드": "겨울 대물 낚시 비결! ❄️\n1. 깊은 수심층 공략\n2. 예민한 찌맞춤\n3. 미끼는 작고 부드럽게!\n정성이 기적을 만듭니다.",
            "서해안/동해안 물때 보는 법과 황금 피크타임": "물때가 곧 실력입니다! 🌊\n1. 7물~10물 사이가 골든 타임!\n2. 간/만조 전후 1시간 집중\n3. 서해는 유속, 동해는 수온 체크!\n자연을 읽어야 손맛을 봅니다.",
            "낚시꾼이 꼭 알아야 할 튼튼한 매듭법 3가지": "안 끊어지는 매듭 3총사! 🪢\n1. 유니노트(만능)\n2. 클린치노트(바늘결합)\n3. 팔로마노트(최강강도)\n이 세 가지만 알면 대물도 걱정 제로!"
        };
        const postBody = fallbacks[data.randomTopic] || "오늘도 대물의 기운을 가득 담아 출조하세요!";
        return `오늘의 낚시 전문 정보! 🎣\n\n${postBody}\n\n오늘도 안전하고 즐거운 손맛 보시길 기원합니다!\n\n#낚시 #바다낚시 #낚스타그램 #대물기원 #생활낚시 #도시어부 #루어낚시 #민물낚시 #붕어낚시 #낚시꿀팁 #캠낚 #주말나들이 #힐링여행`;
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
            console.log('--- 미디어 처리 대기 (30초) ---');
            await new Promise(resolve => setTimeout(resolve, 30000));
            await axios.post(`${this.baseUrl}/${this.igUserId}/media_publish`, {
                creation_id: creationId, access_token: this.accessToken
            });
            return true;
        } catch (error) { 
            console.error('[업로드 실패 사유]:', error.response?.data || error.message); 
            throw error; 
        }
    }
}

async function main() {
    console.log('--- [버전 10.0 - 황금 비율 끝판왕] 가동 ---');
    
    // 주제와 인스타그램 최적화 이미지(1:1 비율 강제 크롭) 매칭
    const topicPool = [
        { topic: "겨울철 대어 낚는 비법과 장비 셋팅 가이드", img: "https://images.pexels.com/photos/1630039/pexels-photo-1630039.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080" },
        { topic: "서해안/동해안 물때 보는 법과 황금 피크타임", img: "https://images.pexels.com/photos/731706/pexels-photo-731706.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080" },
        { topic: "낚시꾼이 꼭 알아야 할 튼튼한 매듭법 3가지", img: "https://images.pexels.com/photos/206064/pexels-photo-206064.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080" }
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
        // ✅ 인스타그램이 가장 좋아하는 1:1 비율 사진을 전송합니다.
        await publisher.publishPost(selected.img, caption); 
        console.log('--- 축하합니다! 드디어 인스타그램 포스팅에 성공했습니다! ---');
    }
}

main().catch(err => { console.error('최종 실패:', err.message); process.exit(1); });
