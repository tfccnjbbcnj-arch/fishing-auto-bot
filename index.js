require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');
const cheerio = require('cheerio');

/**
 * 1. 낚시 데이터 수집 클래스
 */
class FishingScraper {
    async fetchLatestFishingNews() {
        const newsItems = [];
        try {
            const keywords = ['낚시 명소', '바다낚시', '민물낚시 포인트', '루어낚시'];
            const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
            const encodedKeyword = encodeURIComponent(randomKeyword);
            
            // 네이버 뉴스
            const naverUrl = `https://search.naver.com/search.naver?where=news&query=${encodedKeyword}&sort=1`;
            const naverRes = await axios.get(naverUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const $naver = cheerio.load(naverRes.data);
            $naver('.news_tit').each((i, el) => {
                if (i < 3) newsItems.push({ title: $naver(el).text().trim(), link: $naver(el).attr('href') });
            });

            // 다음 뉴스 (백업)
            if (newsItems.length === 0) {
                const daumUrl = `https://search.daum.net/search?w=news&q=${encodedKeyword}`;
                const daumRes = await axios.get(daumUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                const $daum = cheerio.load(daumRes.data);
                $daum('.tit_main').each((i, el) => {
                    if (i < 3) newsItems.push({ title: $daum(el).text().trim(), link: $daum(el).attr('href') });
                });
            }
            console.log(`[뉴스] ${randomKeyword} 키워드로 ${newsItems.length}건 발견`);
            return newsItems;
        } catch (error) { return []; }
    }
}

/**
 * 2. AI 콘텐츠 생성 클래스
 */
class FishingAI {
    constructor(apiKey) { this.genAI = new GoogleGenerativeAI(apiKey); }
    async generateInstagramContent(data) {
        try {
            // 모델명을 gemini-1.5-flash로 고정 (404 에러 해결)
            const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `
            정보: ${JSON.stringify(data, null, 2)}
            매우 중요: 아래 가이드에 따라 인스타그램 게시물을 정성스럽게 작성해줘.
            
            1. 주제: 오늘은 특별히 '${data.randomTopic}'에 대해 자세히 다룰 거야.
            2. 분량: 10줄 이상의 아주 상세하고 풍부한 내용으로 작성해줘. (준비과정부터 팁까지)
            3. 뉴스: 만약 수집된 뉴스가 있다면 자연스럽게 언급하고, 없다면 주제에 집중해줘.
            4. 말투: 듬직한 베테랑 낚시꾼 스타일.
            5. 해시태그 15개 이상. 오직 [Caption] 내용만 출력.
            `;
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (error) { 
            console.error('[AI에러]:', error.message);
            // 최후의 수단: 전형적인 답변 방지를 위해 주제별 수동 응답
            return `오늘의 낚시 꿀팁! 🎣\n\n오늘은 '${data.randomTopic}'에 대해 깊이 있게 알아볼까요? 낚시의 진정한 매력은 역시 기다림과 채비를 준비하는 설렘이죠. 포인트 선정부터 물때 체크까지 꼼꼼히 하셔서 대물 손맛 꼭 보시길 바랍니다!\n\n#낚시 #바다낚시 #낚시꾼 #낚스타그램 #대물기원 #생활낚시 #도시어부 #루어낚시 #힐링 #민물낚시 #붕어낚시 #캠낚`;
        }
    }
}

/**
 * 3. 인스타그램 업로드 클래스
 */
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
            const publish = await axios.post(`${this.baseUrl}/${this.igUserId}/media_publish`, {
                creation_id: creationId, access_token: this.accessToken
            });
            return publish.data;
        } catch (error) { console.error('[업로드에러]:', error.response?.data || error.message); throw error; }
    }
}

/**
 * 4. 메인 실행 함수 (주제-이미지 매칭 도입)
 */
async function main() {
    console.log('--- [버전 4.1] 낚시 자동화 봇 (주제 최적화 버전) 가동 ---');
    if (!process.env.GEMINI_API_KEY) { console.error('API 키 누락!'); return; }
    
    const scraper = new FishingScraper();
    const news = await scraper.fetchLatestFishingNews();
    
    // 주제와 어울리는 이미지 주소를 미리 매칭
    const topicPool = [
        { topic: "겨울철 대어 낚는 비법과 장비 셋팅", img: "https://images.pexels.com/photos/2131910/pexels-photo-2131910.jpeg" }, // 대어
        { topic: "입문자를 위한 민물낚시 채비와 포인트 선정", img: "https://images.pexels.com/photos/1143926/pexels-photo-1143926.jpeg" }, // 민물
        { topic: "낚싯대와 릴의 수명을 늘리는 관리 기술", img: "https://images.pexels.com/photos/206064/pexels-photo-206064.jpeg" }, // 장비
        { topic: "서해안/동해안 물때 보는 법과 황금 피크타임", img: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=80&w=1080&auto=format&fit=crop" }, // 물때/바다
        { topic: "어종별 챔질 타이밍과 손맛 느끼는 법", img: "https://images.pexels.com/photos/1630039/pexels-photo-1630039.jpeg" }, // 액션/손맛
        { topic: "낚시꾼이 꼭 알아야 할 튼튼한 매듭법", img: "https://images.pexels.com/photos/2131911/pexels-photo-2131911.jpeg" } // 매듭/소품
    ];
    
    const selected = topicPool[Math.floor(Math.random() * topicPool.length)];
    const data = { news, randomTopic: selected.topic };

    const ai = new FishingAI(process.env.GEMINI_API_KEY);
    console.log(`[분석] 오늘의 주제: ${selected.topic}`);
    const caption = await ai.generateInstagramContent(data);

    // 인스타그램 크롤러가 잘 인식하는 직접적인 주소 사용
    const imageUrl = selected.img;
    console.log('주제 맞춤형 이미지 사용:', imageUrl);

    if (process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_USER_ID) {
        const publisher = new InstagramPublisher(process.env.INSTAGRAM_ACCESS_TOKEN, process.env.INSTAGRAM_USER_ID);
        await publisher.publishPost(imageUrl, caption);
        console.log('--- 성공! 버전 4.1 작업 완료 ---');
    }
}

main().catch(err => { console.error('최종에러:', err.message); process.exit(1); });
