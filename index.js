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
            const keywords = ['낚시 명소', '바다낚시', '민물낚시', '루어낚시', '낚시 포인트', '대어 낚시'];
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
                if (title && link && title.length > 5 && i < 5) {
                    newsItems.push({ title, link });
                }
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
            const styles = ["유머러스한 어부", "진중한 프로 낚시 강사", "열정 가득한 낚시 유튜버", "감성적인 도시의 낚시꾼"];
            const randomStyle = styles[Math.floor(Math.random() * styles.length)];
            
            const prompt = `
            정보: ${JSON.stringify(data, null, 2)}
            위 정보를 바탕으로 인스타그램 게시물을 정성스럽게 작성해줘.
            
            [가이드]
            1. 컨셉: ${randomStyle} 스타일.
            2. 분량: 5줄에서 10줄 사이로 풍성하게 작성 (단답형 금지).
            3. 내용: 뉴스 요약 또는 주제 '${data.randomTopic}'에 대한 상세한 꿀팁 포함.
            4. 해시태그 15개 이상 포함. [Caption] 만 출력.
            `;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            return "오늘도 대물 손맛 보러 떠나볼까요? 🎣 안전한 출조와 만선을 기원합니다! #낚시 #바다낚시 #낚스타그램 #대물기원 #생활낚시 #도시어부";
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
            console.log('컨테이너 생성 완료. 12초 대기...');
            await new Promise(resolve => setTimeout(resolve, 12000));
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
    console.log('--- 낚시 자동화 봇 가동 시작 ---');
    const scraper = new FishingScraper();
    const news = await scraper.fetchLatestFishingNews();
    
    const dailyTopics = [
        "겨울철 대어 낚는 비법과 장비 셋팅", 
        "입문자를 위한 민물낚시 채비와 포인트 선정법", 
        "낚싯대와 릴의 수명을 늘리는 올바른 관리 기술", 
        "물때 보는 법과 황금 시간대 잡기", 
        "어종별 챔질 타이밍",
        "가장 튼튼한 낚시 매듭법 3가지"
    ];
    const randomTopic = dailyTopics[Math.floor(Math.random() * dailyTopics.length)];
    const data = { news, randomTopic };

    const ai = new FishingAI(process.env.GEMINI_API_KEY);
    console.log('AI 콘텐츠 생성 중 (5~10줄 상세 버전)...');
    const caption = await ai.generateInstagramContent(data);
    
    const fishingImages = [
        "https://images.pexels.com/photos/1630039/pexels-photo-1630039.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1000",
        "https://images.pexels.com/photos/2288107/pexels-photo-2288107.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1000",
        "https://images.pexels.com/photos/2131910/pexels-photo-2131910.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1000",
        "https://images.pexels.com/photos/2131911/pexels-photo-2131911.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1000",
        "https://images.pexels.com/photos/294674/pexels-photo-294674.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1000"
    ];
    
    const imageUrl = fishingImages[Date.now() % fishingImages.length];
    const finalImageUrl = process.env.DEFAULT_IMAGE_URL || imageUrl;

    if (process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_USER_ID) {
        const publisher = new InstagramPublisher(process.env.INSTAGRAM_ACCESS_TOKEN, process.env.INSTAGRAM_USER_ID);
        console.log('인스타그램 업로드 중...');
        await publisher.publishPost(finalImageUrl, caption);
        console.log('모든 작업 성공!');
    }
}

// ⚠️ 이 아랫부분까지 전부 복사하셔야 합니다!
main().catch(err => { console.error('에러:', err); process.exit(1); });
