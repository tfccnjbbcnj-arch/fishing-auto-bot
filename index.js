require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');
const cheerio = require('cheerio');

class FishingScraper {
    async fetchLatestFishingNews() {
        try {
            const keywords = ['낚시 명소', '바다낚시', '민물낚시', '루어낚시', '낚시 포인트', '대어 낚시'];
            const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
            const encodedKeyword = encodeURIComponent(randomKeyword);
            const url = `https://search.naver.com/search.naver?where=news&query=${encodedKeyword}&sm=tab_pge&sort=1`;
            const { data } = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
            });
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
            정보: ${JSON.stringify(data, null, 2)}
            위 정보를 바탕으로 인스타그램 게시물을 아주 상세하게 작성해줘.
            
            [필수 조건]
            1. 분량: 본문 내용을 반드시 **7줄 이상** 풍성하게 작성할 것.
            2. 내용: 뉴스 주제 또는 '${data.randomTopic}'에 대한 상세한 꿀팁과 따뜻한 낚시 인사 포함.
            3. 형식: 인사말 - 본문 상세 설명 - 낚시 꿀팁 - 마무리 조언 순서로 지루하지 않게.
            4. 해시태그 20개 포함. 오직 [Caption] 내용만 출력해.
            `;
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (error) { return "오늘도 대물 손맛 보러 떠나볼까요? 🎣 안전하고 즐거운 낚시 여행 되시길 바랍니다! #낚시 #바다낚시 #낚스타그램 #대물기원 #생활낚시 #도시어부 #루어낚시"; }
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
            console.log('이미지 로딩 대기 중 (15초)...');
            await new Promise(resolve => setTimeout(resolve, 15000));
            const publish = await axios.post(`${this.baseUrl}/${this.igUserId}/media_publish`, {
                creation_id: creationId, access_token: this.accessToken
            });
            return publish.data;
        } catch (error) { console.error('Error:', error.response?.data || error.message); throw error; }
    }
}

async function main() {
    console.log('--- 낚시 자동화 봇 가동 시작 ---');
    const scraper = new FishingScraper();
    const news = await scraper.fetchLatestFishingNews();
    
    // 풍성한 랜덤 주제들
    const dailyTopics = [
        "겨울철 대어 낚는 비법과 장비 셋팅 가이드", 
        "입문자를 위한 민물낚시 채비와 포인트 선정 꿀팁", 
        "낚싯대와 릴의 수명을 늘리는 올바른 관리 기술", 
        "서해안/동해안 물때 보는 법과 황금 시간대 찾는 법",
        "손맛 찌릿하게 느끼는 어종별 챔질 타이밍",
        "낚시 매듭법 중 가장 튼튼한 3가지 실전 매듭"
    ];
    const randomTopic = dailyTopics[Math.floor(Math.random() * dailyTopics.length)];
    const data = { news, randomTopic };

    const ai = new FishingAI(process.env.GEMINI_API_KEY);
    console.log('AI 콘텐츠 생성 중 (풍성한 답변 생성)...');
    const caption = await ai.generateInstagramContent(data);

    // 🎣 100% 낚시 사진들 (새/꽃 완전 배제)
    const fishingImages = [
        "https://images.pexels.com/photos/1630039/pexels-photo-1630039.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1000",
        "https://images.pexels.com/photos/425313/pexels-photo-425313.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1000",
        "https://images.pexels.com/photos/2288107/pexels-photo-2288107.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1000",
        "https://images.pexels.com/photos/2131911/pexels-photo-2131911.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1000",
        "https://images.pexels.com/photos/294674/pexels-photo-294674.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1000"
    ];
    
    // (수정됨) 설정 값 무시하고 무조건 이 리스트 안에서만 사진을 고릅니다.
    const randomImage = fishingImages[Math.floor(Math.random() * fishingImages.length)];
    const imageUrl = randomImage; 
    
    console.log('업로드 예정 이미지:', imageUrl);

    if (process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_USER_ID) {
        const publisher = new InstagramPublisher(process.env.INSTAGRAM_ACCESS_TOKEN, process.env.INSTAGRAM_USER_ID);
        console.log('인스타그램 전송 중...');
        await publisher.publishPost(imageUrl, caption);
        console.log('포스팅 성공! 이제 인스타그램을 확인해 보세요.');
    }
}

// ⚠️ 마지막까지 복사 필수!
main().catch(err => { console.error('치명적 에러:', err); process.exit(1); });
