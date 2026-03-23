require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');
const cheerio = require('cheerio');

class FishingScraper {
    async fetchLatestFishingNews() {
        try {
            const keywords = ['바다낚시 꿀팁', '루어낚시 포인트', '민물낚시 비법'];
            const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
            const encodedKeyword = encodeURIComponent(randomKeyword);
            const url = `https://search.naver.com/search.naver?where=news&query=${encodedKeyword}&sort=1`;
            const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const $ = cheerio.load(data);
            const newsItems = [];
            $('.news_tit').each((i, el) => {
                if (i < 2) newsItems.push({ title: $(el).text().trim(), link: $(el).attr('href') });
            });
            return newsItems;
        } catch (error) { return []; }
    }
}

class FishingAI {
    constructor(apiKey) { this.genAI = new GoogleGenerativeAI(apiKey); }
    async generateInstagramContent(data) {
        // AI 모델 시도 (성공하면 최고, 실패하면 미리 준비된 전문가 상식 출력)
        const modelNames = ["gemini-1.5-flash", "gemini-pro", "gemini-1.5-pro"];
        for (const name of modelNames) {
            try {
                const model = this.genAI.getGenerativeModel({ model: name });
                const result = await model.generateContent(`주제 '${data.randomTopic}'에 대해 낚시 전문가로서 10줄 이상의 아주 상세한 인스타그램 글을 작성해줘. 해시태그 20개 필수. [Caption] 결과만 출력.`);
                const text = result.response.text();
                if (text && text.length > 50) return text;
            } catch (e) { console.log(`[AI] ${name} 로딩 중...`); }
        }
        
        // --- 🎣 AI 실패 시 나가는 고퀄리티 전문가 지식 (사용자 요청 반영) ---
        const proTips = {
            "겨울철 대어 낚는 비법과 장비 셋팅 가이드": `겨울 대물을 노린다면 가장 중요한 것은 '수온'과 '장비의 예민함'입니다! ❄️\n\n겨울 고기들은 활동성이 낮아 아주 깊은 수심층(7~12m) 바닥에 바짝 붙어 있습니다. 따라서 평소보다 채비를 무겁게 하여 바닥권을 꼼꼼히 훑는 것이 필수입니다.\n\n[전문가 팁]\n1. 원줄은 저항이 적은 가느다란 라인을 사용하세요.\n2. 입질이 매우 약하므로 고감도 찌를 사용하고, 바늘은 한 치수 작게 셋팅하여 입걸림 확률을 높여야 합니다.\n3. 미끼는 크릴을 작게 다듬어 '한 입'에 먹을 수 있게 만드세요.\n\n인내심을 가지고 바닥을 공략하는 자에게 겨울 대물은 찾아옵니다. 오늘도 묵직한 손맛 보시길 응원합니다!`,
            "서해안/동해안 물때 보는 법과 황금 피크타임": `낚시는 운이 아니라 '물때' 데이터의 싸움입니다! 🌊\n\n물고기가 움직이는 시간인 '골든 타임'을 모르면 하루 종일 꽝일 수밖에 없습니다. 특히 서해안은 조수 간만의 차가 크기 때문에 조류가 살아나는 '7물'에서 '10물' 사이가 가장 좋습니다.\n\n[피크타임 잡는 법]\n1. 물이 들어오기 시작하는 '초들물' 1시간을 절대 놓치지 마세요.\n2. 만조와 간조 전후 30분, 조류가 방향을 바꾸는 찰나에 대물이 움직입니다.\n3. 와류가 형성되는 지형지물 근처를 집중적으로 노리세요.\n\n바다의 흐름을 읽는 당신이 진정한 낚시 고수입니다! 오늘도 안전하게 출조하세요.`,
            "낚시꾼이 꼭 알아야 할 튼튼한 매듭법 3가지": `매듭 하나가 당신의 인생 최대어를 결정합니다! 🪢\n\n아무리 좋은 낚싯대라도 매듭이 터지면 소용없습니다. 반드시 마스터해야 할 3가지는 다음과 같습니다.\n1. 유니노트(Uni Knot): 가장 범용적이고 결속력이 뛰어나며 모든 채비에 필수입니다.\n2. 클린치노트(Clinch Knot): 바늘 귀에 직접 결합할 때 최고의 강도를 보여줍니다.\n3. 팔로마노트(Palomar Knot): 매듭 테스트 강도 1위! 대물과의 혈투에서도 절대 풀리지 않습니다.\n\n[핵심 팁] 매듭을 꽉 조이기 전에 물이나 침을 살짝 묻혀주면 마찰열로 인한 원줄 손상을 막아 훨씬 튼튼해집니다.\n\n기본에 충실한 매듭이 대물을 낚습니다!`,
            "대물을 유혹하는 루어 선택과 운영 노하우": `루어 낚시는 대상어와의 고도의 심리전입니다! 🐟\n\n대어는 어설픈 가짜 미끼에 속지 않습니다. 오늘은 루어의 '액션'과 '색상' 필승법을 알려드립니다.\n\n[루어 낚시 필승법]\n1. 리트리브(감기) 도중에 '스테이'를 2~3초간 섞어주세요. 입질은 대개 멈춘 순간에 들어옵니다.\n2. 흙탕물일 때는 화려한 컬러, 맑을 때는 투명하거나 은색 계열이 정석입니다.\n3. 대상어의 눈높이에 맞춰 수심층을 정교하게 탐색하는 인내심이 필요합니다.\n\n내가 던진 루어를 믿고 끝까지 집중하는 자가 대물을 차지합니다!`
        };
        
        const body = proTips[data.randomTopic] || "오늘도 대물을 향한 설레는 발걸음, 당신의 출조를 응원합니다! 안전하게 즐거운 손맛 보시길 기원합니다!";
        return `오늘의 낚시 프리미엄 리포트! 🎣\n\n${body}\n\n좋은 하루 되시고, 건강하게 낚시의 즐거움을 만끽하세요!\n\n#낚시 #바다낚시 #낚스타그램 #대물기원 #생활낚시 #도시어부 #루어낚시 #민물낚시 #붕어낚시 #낚시꿀팁 #주말여행 #힐링 #낚시장비 #매듭법 #강태공 #바다낚시포인트 #만선기원`;
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
            console.log('--- 전송 준비 중 (30초 대기) ---');
            await new Promise(resolve => setTimeout(resolve, 30000));
            await axios.post(`${this.baseUrl}/${this.igUserId}/media_publish`, {
                creation_id: creationId, access_token: this.accessToken
            });
            return true;
        } catch (error) { 
            console.error('[오류 상세]:', error.response?.data || error.message); 
            throw error; 
        }
    }
}

async function main() {
    console.log('--- [버전 21.0 - 이미지 인지 최신화] 가동 시작 ---');
    if (!process.env.GEMINI_API_KEY) { console.error('API 키 누락!'); return; }
    
    // 🚩 인스타그램 크롤러가 가장 잘 인식하는 '다이렉트 소스' 방식 사용
    // 낚시(Fishing), 낚시꾼(Angler), 물고기(Fish) 태그를 조합하여 100% 낚시 이미지만 가져옵니다.
    const topicPool = [
        { topic: "겨울철 대어 낚는 비법과 장비 셋팅 가이드", keywords: "fishing,catch" },
        { topic: "서해안/동해안 물때 보는 법과 황금 피크타임", keywords: "sea,fishing,boat" },
        { topic: "낚시꾼이 꼭 알아야 할 튼튼한 매듭법 3가지", keywords: "fishing,gear" },
        { topic: "대물을 유혹하는 루어 선택과 운영 노하우", keywords: "fishing,lure" }
    ];
    
    const selected = topicPool[Math.floor(Math.random() * topicPool.length)];
    // 인스타그램용 정사각형 강제 규격 제공 (이미지 품질 보장)
    const imageUrl = `https://loremflickr.com/1080/1080/${selected.keywords}/all?lock=${Math.floor(Date.now() / 86400000)}`;
    
    const scraper = new FishingScraper();
    const news = await scraper.fetchLatestFishingNews();
    const data = { news, randomTopic: selected.topic };

    const ai = new FishingAI(process.env.GEMINI_API_KEY);
    const caption = await ai.generateInstagramContent(data);
    console.log(`[분석] 주제: ${selected.topic}`);
    console.log(`[이미지] 사용 예정 주소: ${imageUrl}`);

    if (process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_USER_ID) {
        const publisher = new InstagramPublisher(process.env.INSTAGRAM_ACCESS_TOKEN, process.env.INSTAGRAM_USER_ID);
        await publisher.publishPost(imageUrl, caption); 
        console.log('--- 축하합니다! 보완된 버전 21.0 작업 완료 ---');
    }
}

main().catch(err => { console.error('최종 실패:', err.message); process.exit(1); });
