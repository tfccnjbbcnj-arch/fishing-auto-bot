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
            const styles = ["유머러스한 어부", "진중한 프로 낚시꾼", "열정적인 낚시광", "감성적인 도시어부", "재치 있는 낚시 인플루언서"];
            const randomStyle = styles[Math.floor(Math.random() * styles.length)];
            const prompt = `
            정보: ${JSON.stringify(data, null, 2)}
            위 정보를 바탕으로 인스타그램 게시물을 작성해줘.
            1. 컨셉: ${randomStyle} 스타일.
            2. 내용: 뉴스 요약 또는 주제 '${data.randomTopic}'에 대한 유익하고 재미있는 이야기.
            3. 매번 다른 표현 사용, 해시태그 15개 포함. [Caption] 만 출력.
            `;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
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
    
    const dailyTopics = ["겨울 대어 낚는 비법", "낚싯대 관리 꿀팁", "초보 채비 추천", "낚시 매듭법", "물때 보는 법 기초", "손맛 좋은 어종"];
    const randomTopic = dailyTopics[Math.floor(Math.random() * dailyTopics.length)];
    const data = { news, randomTopic };

    const ai = new FishingAI(process.env.GEMINI_API_KEY);
    const caption = await ai.generateInstagramContent(data);
    console.log('캡션 생성 완료.');

    const fishingImages = [
        "https://images.pexels.com/photos/1630039/pexels-photo-1630039.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1000", // 낚시꾼
        "https://images.pexels.com/photos/2288107/pexels-photo-2288107.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1000", // 낚시하는 사람
        "https://images.pexels.com/photos/731706/pexels-photo-731706.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1000",   // 평화로운 낚시 (노을)
        "https://images.pexels.com/photos/1113926/pexels-photo-1113926.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1000", // 찌(낚시 도구)
        "https://images.pexels.com/photos/206064/pexels-photo-206064.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1000"     // 낚시 릴과 장비
    ];
    // 랜덤 이미지 선택 및 환경변수(DEFAULT_IMAGE_URL)가 있을 경우 우선 사용
    const randomImage = fishingImages[new Date().getSeconds() % fishingImages.length];
    const imageUrl = process.env.DEFAULT_IMAGE_URL || randomImage;

    if (process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_USER_ID) {
        const publisher = new InstagramPublisher(process.env.INSTAGRAM_ACCESS_TOKEN, process.env.INSTAGRAM_USER_ID);
        await publisher.publishPost(imageUrl, caption);
        console.log('포스팅 성공!');
    }
}

main().catch(err => { console.error('에러:', err); process.exit(1); });
