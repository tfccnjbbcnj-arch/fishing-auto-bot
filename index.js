require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');
const cheerio = require('cheerio');

/**
 * 1. 낚시 데이터 수집 클래스 (네이버 + 다음 뉴스 교차 수집)
 */
class FishingScraper {
    async fetchLatestFishingNews() {
        const newsItems = [];
        try {
            const keywords = ['낚시 명소', '바다낚시', '민물낚시 포인트', '루어낚시'];
            const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
            const encodedKeyword = encodeURIComponent(randomKeyword);
            
            // 네이버 뉴스 시도
            const naverUrl = `https://search.naver.com/search.naver?where=news&query=${encodedKeyword}&sort=1`;
            const naverRes = await axios.get(naverUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const $naver = cheerio.load(naverRes.data);
            $naver('.news_tit').each((i, el) => {
                if (i < 3) newsItems.push({ title: $naver(el).text().trim(), link: $naver(el).attr('href') });
            });

            // 데이터가 없으면 다음 뉴스 시도
            if (newsItems.length === 0) {
                const daumUrl = `https://search.daum.net/search?w=news&q=${encodedKeyword}`;
                const daumRes = await axios.get(daumUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                const $daum = cheerio.load(daumRes.data);
                $daum('.tit_main').each((i, el) => {
                    if (i < 3) newsItems.push({ title: $daum(el).text().trim(), link: $daum(el).attr('href') });
                });
            }
            console.log(`[뉴스수집] 총 ${newsItems.length}건 수집됨`);
            return newsItems;
        } catch (error) { 
            console.error('[뉴스수집 에러]:', error.message);
            return []; 
        }
    }
}

/**
 * 2. AI 콘텐츠 생성 클래스 (모델명 수정 및 로직 강화)
 */
class FishingAI {
    constructor(apiKey) { this.genAI = new GoogleGenerativeAI(apiKey); }
    async generateInstagramContent(data) {
        try {
            // gemini-1.5-flash-latest 대신 gemini-1.5-flash 사용 (404 방지)
            const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `
            정보: ${JSON.stringify(data, null, 2)}
            위 정보를 바탕으로 인스타그램 게시물을 정성스럽게 작성해줘.
            
            1. 분량: 본문 내용을 7줄 이상의 장문으로 상세하게 작성.
            2. 내용: 주제 '${data.randomTopic}'에 대해 베테랑 낚시꾼으로서 조언을 해줘.
            3. 뉴스 정보가 있다면 같이 언급해주고, 없어도 주제 중심의 유익한 글을 써줘.
            4. 해시태그 20개 포함. 오직 [Caption] 내용만 출력.
            `;
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (error) { 
            console.error('[AI생성 에러]:', error.message);
            return `오늘의 낚시 정보! 🎣\n\n${data.randomTopic}에 대해 알아보는 시간입니다. 낚시는 준비 과정부터가 즐거움이죠. 오늘도 안전하고 즐거운 출조 되시길 응원합니다!\n\n#낚시 #바다낚시 #낚시꾼 #낚스타그램 #도시어부 #루어낚시 #대물기원 #생활낚시 #취미생활 #낚시포인트 #바다 #민물낚시 #붕어낚시 #캠낚 #힐링`;
        }
    }
}

/**
 * 3. 인stagram 업로드 클래스
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
            console.log('--- 인스타그램 서버 처리 대기 (20초) ---');
            await new Promise(resolve => setTimeout(resolve, 20000));
            const publish = await axios.post(`${this.baseUrl}/${this.igUserId}/media_publish`, {
                creation_id: creationId, access_token: this.accessToken
            });
            return publish.data;
        } catch (error) { 
            console.error('[인스타 업로드 에러]:', error.response?.data || error.message); 
            throw error; 
        }
    }
}

/**
 * 4. 메인 실행 함수
 */
async function main() {
    console.log('--- [버전 4.0] 낚시 자동화 봇 최종 가동 ---');
    if (!process.env.GEMINI_API_KEY) { console.error('API 키 누락!'); return; }
    
    const scraper = new FishingScraper();
    const news = await scraper.fetchLatestFishingNews();
    const dailyTopics = [
        "겨울철 대어 낚는 비법과 장비 셋팅", "입문자를 위한 민물 채비와 포인트 선정", 
        "낚싯대와 릴의 수명을 늘리는 관리 기술", "물때 보는 법과 피크타임 찾는 법",
        "손맛 찌릿하게 느끼는 어종별 챔질 타이밍", "낚시 매듭법 튼튼한 베스트 3가지"
    ];
    const randomTopic = dailyTopics[Math.floor(Math.random() * dailyTopics.length)];
    const data = { news, randomTopic };

    const ai = new FishingAI(process.env.GEMINI_API_KEY);
    const caption = await ai.generateInstagramContent(data);
    console.log('[게시글 생성 완료]');

    // 🎣 인스타그램 크롤러가 가장 잘 인식하는 LoremFlickr 사용 (낚시 전용 사진)
    // LoremFlickr는 Meta 크롤러의 차단 우려가 적고 항상 유효한 이미지를 반환합니다.
    const imageUrl = `https://loremflickr.com/1080/1080/fishing,fisherman,fish/all?lock=${Date.now()}`;
    console.log('업로드 시도 이미지 주소:', imageUrl);

    if (process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_USER_ID) {
        const publisher = new InstagramPublisher(process.env.INSTAGRAM_ACCESS_TOKEN, process.env.INSTAGRAM_USER_ID);
        await publisher.publishPost(imageUrl, caption);
        console.log('--- 모든 작업 성공! 버전 4.0 완료 ---');
    }
}

main().catch(err => { console.error('최종 실패:', err.message); process.exit(1); });
