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
            const keywords = ['낚시 명소', '바다낚시', '민물낚시', '루어낚시', '낚시 대회', '낚시 포인트'];
            const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
            const encodedKeyword = encodeURIComponent(randomKeyword);
            const url = `https://search.naver.com/search.naver?where=news&query=${encodedKeyword}&sm=tab_pge&sort=1`;
            const { data } = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
            });
            const $ = cheerio.load(data);
            const newsItems = [];
            $('.news_tit, .news_area a.news_tit, a.news_tit').each((i, el) => {
                const title = $(el).text().trim();
                const link = $(el).attr('href');
                if (title && link && i < 5) newsItems.push({ title, link });
            });
            return newsItems;
        } catch (error) {
            console.error('Scraper Error:', error.message);
            return [];
        }
    }
}

/**
 * 2. AI 콘텐츠 생성 클래스
 */
class FishingAI {
    constructor(apiKey) {
        this.genAI = new GoogleGenerativeAI(apiKey);
    }
    async generateInstagramContent(data) {
        try {
            const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
            const styles = ["유머러스한 어부", "진중한 프로 낚시꾼", "열정적인 낚시광", "감성적인 도시어부"];
            const randomStyle = styles[Math.floor(Math.random() * styles.length)];
            const prompt = `
            정보: ${JSON.stringify(data, null, 2)}
            위 정보를 바탕으로 인스타그램 게시물을 작성해줘.
            1. 컨셉: ${randomStyle} 스타일.
            2. 내용: 뉴스 요약 또는 주제 '${data.randomTopic}'에 대한 조언.
            3. 매번 다른 표현 사용, 해시태그 15개 포함. [Caption] 만 출력.
            `;
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (error) {
            return "오늘도 대물 낚으러 떠나볼까요? 🎣 #낚시 #바다낚시 #낚스타그램 #대물기원";
        }
    }
}

/**
 * 3. 인스타그램 업로드 클래스
 */
class InstagramPublisher {
    constructor(accessToken, igUserId) {
        this.accessToken = accessToken;
        this.igUserId = igUserId;
        this.baseUrl = `https://graph.facebook.com/v20.0`;
    }
    async publishPost(imageUrl, caption) {
        try {
            const res = await axios.post(`${this.baseUrl}/${this.igUserId}/media`, {
                image_url: imageUrl, caption: caption, access_token: this.accessToken
            });
            const creationId = res.data.id;
            console.log('컨테이너 생성 완료. 10초 대기...');
            await new Promise(resolve => setTimeout(resolve, 10000));
            const publish = await axios.post(`${this.baseUrl}/${this.igUserId}/media_publish`, {
                creation_id: creationId, access_token: this.accessToken
            });
            return publish.data;
        } catch (error) {
            console.error('Publish Error:', error.response?.data || error.message);
            throw error;
        }
    }
}

/**
 * 4. 메인 실행 함수
 */
async function main() {
    console.log('--- 낚시 자동화 봇 통합 버전 가동 시작 ---');
    const scraper = new FishingScraper();
    const news = await scraper.fetchLatestFishingNews();
    
    const dailyTopics = ["낚싯대 관리법", "초보 채비 추천", "낚시 매듭법", "물때 보는 법", "손맛 좋은 어종"];
    const randomTopic = dailyTopics[Math.floor(Math.random() * dailyTopics.length)];
    const data = { news, randomTopic };

    const ai = new FishingAI(process.env.GEMINI_API_KEY);
    const caption = await ai.generateInstagramContent(data);
    console.log('캡션 생성 완료.');

    const fishingImages = [
        "https://images.pexels.com/photos/1630039/pexels-photo-1630039.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1000",
        "https://images.pexels.com/photos/2288107/pexels-photo-2288107.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1000",
        "https://images.pexels.com/photos/2131910/pexels-photo-2131910.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1000",
        "https://images.pexels.com/photos/206064/pexels-photo-206064.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1000",
        "https://images.pexels.com/photos/294674/pexels-photo-294674.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1000"
    ];
    const imageUrl = fishingImages[new Date().getSeconds() % fishingImages.length];

    if (process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_USER_ID) {
        const publisher = new InstagramPublisher(process.env.INSTAGRAM_ACCESS_TOKEN, process.env.INSTAGRAM_USER_ID);
        await publisher.publishPost(imageUrl, caption);
        console.log('포스팅 성공!');
    }
}

main().catch(err => { console.error('에러:', err); process.exit(1); });
