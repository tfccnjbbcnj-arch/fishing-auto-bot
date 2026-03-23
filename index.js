require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');
const cheerio = require('cheerio');

class FishingScraper {
    async fetchLatestFishingNews() {
        try {
            const keywords = ['낚시 포인트', '바다낚시 꿀팁', '대물 낚시', '루어낚시 포인트'];
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
            return newsItems;
        } catch (error) { return []; }
    }
}

class FishingAI {
    constructor(apiKey) { this.genAI = new GoogleGenerativeAI(apiKey); }
    async generateInstagramContent(data) {
        try {
            const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
            const prompt = `
            낚시 정보: ${JSON.stringify(data, null, 2)}
            위 정보를 바탕으로 인스타그램 게시물을 **아주 길고 정성스럽게(최소 10줄 이상)** 작성해줘.
            
            [미션]
            1. 분량: 무조건 **10줄 이상의 장문**으로 작성할 것. (짧으면 안됨!)
            2. 구성: [인사말 - 수집된 낚시 정보 공유 - 오늘의 낚시 지식(${data.randomTopic}) 설명 - 낚시인들에게 전하는 응원 - 마무리 인사]
            3. 말투: 베테랑 낚시꾼이 친한 후배에게 알려주는 것처럼 다정하고 상세하게.
            4. 해시태그: 낚시 관련 인기 태그 20개 이상.
            5. 오직 [Caption] 내용만 출력할 것.
            `;
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (error) { return "오늘도 대물 낚으러 떠나볼까요? 🎣 안전한 낚시 여행 되세요! #낚시 #바다낚시 #대물기원 #낚스타그램 #도시어부"; }
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
            console.log('--- 미디어 준비 중 (18초 대기) ---');
            await new Promise(resolve => setTimeout(resolve, 18000));
            const publish = await axios.post(`${this.baseUrl}/${this.igUserId}/media_publish`, {
                creation_id: creationId, access_token: this.accessToken
            });
            return publish.data;
        } catch (error) { console.error('API Error:', error.response?.data || error.message); throw error; }
    }
}

async function main() {
    console.log('--- [버전 3.0] 낚시 자동화 봇 가동 ---');
    if (!process.env.GEMINI_API_KEY) { console.error('API 키 누락!'); return; }
    
    const scraper = new FishingScraper();
    const news = await scraper.fetchLatestFishingNews();
    const dailyTopics = [
        "겨울철 대어 낚는 비법과 채비 셋팅법", "낚싯대와 릴을 오래 쓰는 전문 관리법", 
        "서해/동해 물때 보는 법과 황금 피크타임", "입문자를 위한 낚시 매듭법 3종 세트",
        "손맛 찌릿하게 느끼는 어종별 챔질 타이밍 기술", "낚시꾼이 꼭 알아야 할 바다 안전 수칙"
    ];
    const randomTopic = dailyTopics[Math.floor(Math.random() * dailyTopics.length)];
    const data = { news, randomTopic };

    const ai = new FishingAI(process.env.GEMINI_API_KEY);
    console.log('AI가 장문의 게시글을 작성 중입니다...');
    const caption = await ai.generateInstagramContent(data);

    // 🎣 꽃 사진 절대 없는 선명한 낚시 전용 Unsplash 이미지
    const fishingImages = [
        "https://images.unsplash.com/photo-1544434250-9ad982739343?q=80&w=1080&auto=format&fit=crop", // 보트 위 낚싯대
        "https://images.unsplash.com/photo-1534431811412-8756ed444358?q=80&w=1080&auto=format&fit=crop", // 낚시하는 사람 전신
        "https://images.unsplash.com/photo-1518005020250-675f0f0fd130?q=80&w=1080&auto=format&fit=crop", // 낚시 루어(가짜 미끼)
        "https://images.unsplash.com/photo-1529230117712-640ff41eeace?q=80&w=1080&auto=format&fit=crop", // 호수 낚시 풍경
        "https://images.unsplash.com/photo-1499242015907-fd91d9d0c72d?q=80&w=1080&auto=format&fit=crop"  // 낚시 장비 클로즈업
    ];
    
    // 무조건 낚시 사진만 선택 (환경변수 무시)
    const seed = Math.floor(Math.random() * fishingImages.length);
    const imageUrl = fishingImages[seed];
    console.log('선택된 이미지 URL:', imageUrl);

    if (process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_USER_ID) {
        const publisher = new InstagramPublisher(process.env.INSTAGRAM_ACCESS_TOKEN, process.env.INSTAGRAM_USER_ID);
        console.log('인스타그램 전송 중...');
        await publisher.publishPost(imageUrl, caption);
        console.log('--- 포스팅 성공! 버전 3.0 작업 완료 ---');
    }
}

main().catch(err => { console.error('에러 발생:', err); process.exit(1); });
