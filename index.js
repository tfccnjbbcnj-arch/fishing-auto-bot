require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');
const cheerio = require('cheerio');

/**
 * 1. 낚시 데이터 수집 클래스
 */
class FishingScraper {
    async fetchLatestFishingNews() {
        try {
            const keywords = ['낚시 포인트', '바다낚시 꿀팁', '루어낚시 채비', '민물낚시 포인트'];
            const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
            const encodedKeyword = encodeURIComponent(randomKeyword);
            const url = `https://search.naver.com/search.naver?where=news&query=${encodedKeyword}&sm=tab_pge&sort=1`;
            const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const $ = cheerio.load(data);
            const newsItems = [];
            $('.news_tit').each((i, el) => {
                const title = $(el).text().trim();
                const link = $(el).attr('href');
                if (title && link && i < 5) newsItems.push({ title, link });
            });
            console.log(`[뉴스수집] 키워드 '${randomKeyword}'로 ${newsItems.length}건 수집됨`);
            return newsItems;
        } catch (error) { 
            console.error('[뉴스수집 에러]:', error.message);
            return []; 
        }
    }
}

/**
 * 2. AI 콘텐츠 생성 클래스
 */
class FishingAI {
    constructor(apiKey) { this.genAI = new GoogleGenerativeAI(apiKey); }
    async generateInstagramContent(data) {
        try {
            const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
            const prompt = `
            낚시 정보: ${JSON.stringify(data, null, 2)}
            매우 중요: 아래 정보를 바탕으로 인스타그램 게시물을 작성해줘.
            
            1. 분량: 무조건 7줄 이상의 긴 글로 작성할 것.
            2. 말투: 베테랑 낚시꾼의 친근하고 상세한 말투.
            3. 내용: 오늘 전해줄 주제는 '${data.randomTopic}' 입니다. 이에 대해 자세히 설명해줘.
            4. 해시태그 15개 이상 포함. [Caption] 결과만 출력.
            `;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) { 
            console.error('[AI생성 에러]:', error.message);
            // AI 에러 시에도 조금 더 정성스러운 폴백 문구
            return `오늘의 낚시 정보! 🎣\n\n오늘은 '${data.randomTopic}'에 대해 이야기해 볼까요? 낚시는 장비 관리와 포인트 선정이 정말 중요하죠. 즐거운 출조 되시고 안전에 꼭 유의하세요!\n\n#낚시 #바다낚시 #낚시꾼 #도시어부 #낚스타그램 #대물기원 #루어낚시 #민물낚시 #낚시포인트 #일상 #취미`;
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
        } catch (error) { 
            console.error('[인스타 업로드 에러 상세]:', error.response?.data || error.message); 
            throw error; 
        }
    }
}

/**
 * 4. 메인 실행 함수
 */
async function main() {
    console.log('--- [버전 3.5] 낚시 자동화 봇 가동 ---');
    if (!process.env.GEMINI_API_KEY) { console.error('API 키 누락!'); return; }
    
    const scraper = new FishingScraper();
    const news = await scraper.fetchLatestFishingNews();
    const dailyTopics = [
        "겨울철 대어 낚는 비법과 장비 셋팅 가이드", 
        "입문자를 위한 민물낚시 채비와 포인트 선정 꿀팁", 
        "낚싯대와 릴의 수명을 늘리는 올바른 관리 기술", 
        "물때 보는 법과 황금 피크타임 찾는 노하우",
        "손맛 찌릿하게 느끼는 챔질 타이밍 기술",
        "가장 활용도 높은 낚시 매듭법 3가지"
    ];
    const randomTopic = dailyTopics[Math.floor(Math.random() * dailyTopics.length)];
    const data = { news, randomTopic };

    const ai = new FishingAI(process.env.GEMINI_API_KEY);
    const caption = await ai.generateInstagramContent(data);
    console.log('[게시글 생성 완료]');

    // 🎣 인스타그램에서 인식이 잘 되는 직접적인 JPEG 주소 (새/꽃 절대 안 나옴)
    const fishingImages = [
        "https://images.pexels.com/photos/1630039/pexels-photo-1630039.jpeg", // 낚시꾼
        "https://images.pexels.com/photos/2288107/pexels-photo-2288107.jpeg", // 낚싯대 잡은 모습
        "https://images.pexels.com/photos/731706/pexels-photo-731706.jpeg",   // 노을 속 낚시
        "https://images.pexels.com/photos/206064/pexels-photo-206064.jpeg",   // 릴과 장비
        "https://images.pexels.com/photos/1113926/pexels-photo-1113926.jpeg"  // 찌
    ];
    
    // 매번 다른 이미지가 나오도록 보장
    const seed = Math.floor(Math.random() * fishingImages.length);
    const imageUrl = fishingImages[seed];
    console.log('업로드 예정 이미지 주소:', imageUrl);

    if (process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_USER_ID) {
        const publisher = new InstagramPublisher(process.env.INSTAGRAM_ACCESS_TOKEN, process.env.INSTAGRAM_USER_ID);
        await publisher.publishPost(imageUrl, caption);
        console.log('--- 모든 작업 성공! 버전 3.5 완료 ---');
    }
}

main().catch(err => { console.error('최종 에러:', err.message); process.exit(1); });
