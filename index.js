require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');
const cheerio = require('cheerio');

class FishingScraper {
    async fetchLatestFishingNews() {
        const newsItems = [];
        try {
            const keywords = ['낚시 포인트', '바다낚시 꿀팁', '대물 낚시'];
            const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
            const encodedKeyword = encodeURIComponent(randomKeyword);
            const url = `https://search.naver.com/search.naver?where=news&query=${encodedKeyword}&sort=1`;
            const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const $ = cheerio.load(data);
            $('.news_tit').each((i, el) => {
                if (i < 3) newsItems.push({ title: $(el).text().trim(), link: $(el).attr('href') });
            });
            console.log(`[뉴스수집 완료] ${newsItems.length}건`);
            return newsItems;
        } catch (error) { return []; }
    }
}

class FishingAI {
    constructor(apiKey) { this.genAI = new GoogleGenerativeAI(apiKey); }
    async generateInstagramContent(data) {
        try {
            const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `
            낚시 정보: ${JSON.stringify(data, null, 2)}
            
            미션: 아래 가이드에 따라 인스타그램 게시물을 **최소 10줄 이상** 작성해줘.
            1. 주제: 오늘은 '${data.randomTopic}'에 대해 베테랑 낚시꾼으로서 아주 상세하게 설명해줄 거야.
            2. 내용: 낚시의 기초와 구체적인 꿀팁, 그리고 낚시인들에게 전하는 따뜻한 응원을 담아줘.
            3. 뉴스: 수집된 뉴스가 있다면 언급하고 없으면 주제에만 집중해줘.
            4. 해시태그 20개 포함. 오직 [Caption] 내용만 출력.
            `;
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (error) { 
            console.error('[AI에러]:', error.message);
            return `오늘의 낚시 꿀팁! 🎣\n\n${data.randomTopic}에 대해 자세히 알아볼까요? 낚시의 진정한 즐거움은 자연 속에서 느끼는 한 번의 강력한 손맛이죠! 오늘도 대물의 기운이 함께하시길 바라며 즐거운 출조 되세요!\n\n#낚시 #바다낚시 #낚스타그램 #대물기원 #생활낚시 #도시어부 #루어낚시 #민물낚시 #붕어낚시 #캠낚`;
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
            const publish = await axios.post(`${this.baseUrl}/${this.igUserId}/media_publish`, {
                creation_id: creationId, access_token: this.accessToken
            });
            return publish.data;
        } catch (error) { console.error('[업로드 에러]:', error.response?.data || error.message); throw error; }
    }
}

async function main() {
    console.log('--- [버전 5.0 - 최종 낚시 봇] 가동 시작 ---');
    if (!process.env.GEMINI_API_KEY) { console.error('API 키 누락!'); return; }
    
    // 주제와 어울리는 '확실한' 이미지 매칭 (이상한 사진 절대 없음)
    const topicPool = [
        { topic: "겨울철 대어 낚는 비법과 장비 셋팅 가이드", img: "https://images.pexels.com/photos/2131910/pexels-photo-2131910.jpeg" }, // 잡힌 물고기
        { topic: "낚싯대와 릴의 수명을 늘리는 올바른 관리 기술", img: "https://images.pexels.com/photos/2131911/pexels-photo-2131911.jpeg" }, // 낚시장비들
        { topic: "서해안/동해안 물때 보는 법과 황금 피크타임", img: "https://images.unsplash.com/photo-1499242015907-fd91d9d0c72d?q=80&w=1080&auto=format&fit=crop" }, // 바다와 수평선
        { topic: "어종별 챔질 타이밍과 손맛 느끼는 기술", img: "https://images.pexels.com/photos/1630039/pexels-photo-1630039.jpeg" }, // 갯바위 낚시
        { topic: "낚시꾼이 꼭 알아야 할 튼튼한 매듭법 3가지", img: "https://images.pexels.com/photos/294674/pexels-photo-294674.jpeg" }  // 루어/미끼
    ];
    
    const selected = topicPool[Math.floor(Math.random() * topicPool.length)];
    console.log(`[매칭] 오늘의 주제: ${selected.topic}`);
    
    const scraper = new FishingScraper();
    const news = await scraper.fetchLatestFishingNews();
    const data = { news, randomTopic: selected.topic };

    const ai = new FishingAI(process.env.GEMINI_API_KEY);
    const caption = await ai.generateInstagramContent(data);
    console.log('[생성] 게시글 생성 완료');

    const imageUrl = selected.img;
    console.log('[설정] 최종 업로드 이미지:', imageUrl);

    if (process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_USER_ID) {
        const publisher = new InstagramPublisher(process.env.INSTAGRAM_ACCESS_TOKEN, process.env.INSTAGRAM_USER_ID);
        await publisher.publishPost(imageUrl, caption);
        console.log('--- 성공! 버전 5.0 포스팅 완료 ---');
    }
}

main().catch(err => { console.error('최종 실패:', err.message); process.exit(1); });
