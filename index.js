require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');
const cheerio = require('cheerio');

/**
 * 1. 낚시 데이터 수집 클래스 (네이버 뉴스 및 대체 검색 보강)
 */
class FishingScraper {
    async fetchLatestFishingNews() {
        try {
            const keywords = ['낚시 명소', '바다낚시', '민물낚시', '루어낚시', '낚시 대회', '낚시 포인트', '대도 낚시'];
            const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
            const encodedKeyword = encodeURIComponent(randomKeyword);
            const url = `https://search.naver.com/search.naver?where=news&query=${encodedKeyword}&sm=tab_pge&sort=1`;
            const { data } = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
            });
            const $ = cheerio.load(data);
            const newsItems = [];
            
            // 더 넓은 범위의 뉴스 제목 선택자
            $('.news_tit, .news_area a.news_tit, a.news_tit, .info_group a').each((i, el) => {
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
 * 2. AI 콘텐츠 생성 클래스 (길이 및 풍부함 강화)
 */
class FishingAI {
    constructor(apiKey) {
        this.genAI = new GoogleGenerativeAI(apiKey);
    }
    async generateInstagramContent(data) {
        try {
            const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
            const styles = ["유머러스하고 재치있는 어부", "진중한 프로 낚시 강사", "열정 가득한 낚시 유튜버", "감성적인 도시의 낚시꾼"];
            const randomStyle = styles[Math.floor(Math.random() * styles.length)];
            
            // AI에게 더 자세하고 긴 글(5~8줄)을 작성하도록 지시
            const prompt = `
            정보: ${JSON.stringify(data, null, 2)}
            위 정보를 바탕으로 인스타그램 게시물을 아주 정성스럽게 작성해줘.
            
            [작성 가이드]
            1. 말투: ${randomStyle} 스타일로 생생하게.
            2. 분량: 본문 내용을 5줄에서 10줄 사이로 풍성하게 작성할 것 (단답형 금지).
            3. 내용: 수집된 뉴스 요약 또는 주제 '${data.randomTopic}'에 대한 상세한 경험담과 꿀팁을 섞어서 작성.
            4. 구성: 인사말 - 본문(이슈/팁) - 맺음말 순서로 자연스럽게.
            5. 해시태그: 낚시 관련 인기 태그 15개 이상 포함.
            
            출력 형식은 오직 [Caption] 내용만 보여줘.
            `;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            return "오늘도 대물 손맛 보러 떠나볼까요? 🎣 안전한 출조와 만선을 기원합니다! 날씨와 물때 체크 잊지 마시고 즐거운 낚시 되세요. #낚시 #바다낚시 #낚스타그램 #대물기원 #생활낚시 #도시어부 #루어낚시";
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
            console.log('컨테이너 생성 완료 (ID: ' + creationId + '). 대기 중...');
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
    console.log('--- 낚시 자동화 봇 통합 버전 (개선판) 가동 ---');
    const scraper = new FishingScraper();
    const news = await scraper.fetchLatestFishingNews();
    
    // 더 풍부한 랜덤 주제 (뉴스 없을 때 대비)
    const dailyTopics = [
        "겨울철 대어 낚는 비법과 장비 셋팅", 
        "입문자를 위한 민물낚시 채비와 포인트 선정법", 
        "낚싯대와 릴의 수명을 늘리는 올바른 관리 기술", 
        "서해안/동해안 물때 보는 법과 황금 시간대", 
        "손맛 찌릿하게 느끼는 어종별 챔질 타이밍",
        "낚시 매듭법 중 가장 튼튼한 3가지 방법"
    ];
    const randomTopic = dailyTopics[Math.floor(Math.random() * dailyTopics.length)];
    const data = { news, randomTopic };

