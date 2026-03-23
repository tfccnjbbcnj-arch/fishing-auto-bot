require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');
const cheerio = require('cheerio');

class FishingScraper {
    async fetchLatestFishingNews() {
        try {
            const keywords = ['바다낚시 꿀팁', '루어낚시 채비', '민물낚시 포인트'];
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
        // [수정] 모델명을 gemini-pro로 시도하여 안정성 확보
        const modelNames = ["gemini-pro", "gemini-1.5-flash"];
        for (const name of modelNames) {
            try {
                const model = this.genAI.getGenerativeModel({ model: name });
                const result = await model.generateContent(`주제 '${data.randomTopic}'에 대해 낚시 전문가로서 15줄 이상의 상세한 인스타그램 게시물을 작성해줘. 실무 기술을 포함하고 해시태그 20개를 달아줘. [Caption] 결과만 출력.`);
                const text = result.response.text();
                if (text && text.length > 50) return text;
            } catch (e) { console.log(`[AI] ${name} 로딩 중...`); }
        }
        
        // --- 🎣 AI 실패 시에도 '사람보다 더 잘 쓴' 주제별 최고급 비법서 ---
        const highProTips = {
            "겨울철 대어 낚는 비념과 장비 셋팅 가이드": `겨울 대물 낚시의 핵심은 '공략 수심'과 '기다림'입니다! ❄️\n\n[전문가 비법]\n1. 포인트: 수온이 안정적인 7~12m 바닥층을 집요하게 공략하세요.\n2. 채비: 입질이 매우 미세하므로 저부력찌와 최대한 가벼운 바늘을 사용하는 것이 승부수입니다.\n3. 미끼: 활동성이 떨어진 녀석들을 위해 크릴은 작고 부드럽게 유지하세요.\n\n겨울 낚시는 장비 셋팅만 잘해도 절반은 성공입니다. 오늘 한 번의 묵직한 손맛을 기대해보세요!`,
            "서해안/동해안 물때 보는 법과 황금 피크타임": `조황의 마스터키, '물때'를 읽으면 꽝이 없습니다! 🌊\n\n[필승 타임체크]\n1. 서해: 조류가 살아나는 '7물~10물' 사이가 활동성이 가장 왕성합니다.\n2. 동해: 수온과 용오름 현상을 체크하고, 방파제 사이의 와류를 노리세요.\n3. 피크: 간조에서 만조로 바뀌는 '초들물' 1시간이 최고의 골든 타임입니다.\n\n자연의 흐름에 맞춰 채비를 던지세요. 바다는 준비된 자에게 대물을 허락합니다!`,
            "낚시꾼이 꼭 알아야 할 튼튼한 매듭법 3가지": `매듭 하나가 당신의 인생 최대어를 결정한다는 사실! 🪢\n\n[3대 필수 매듭]\n1. 유니노트: 모든 채비에 신속하고 강력하게 결합되는 만능형입니다.\n2. 클린치노트: 도래와 바늘 결합 시 가장 높은 인장 강도를 자랑합니다.\n3. 팔로마노트: 매듭 중 가장 강도가 강력하여 대물과의 힘싸움에 유리합니다.\n\n매듭을 조이기 전 물을 살짝 묻히면 마찰열을 막아 강도가 2배 올라갑니다!`,
            "대물을 유혹하는 루어 선택과 운영 노하우": `루어 낚시는 정교한 '속임수'의 미학입니다! 🐟\n\n[루어 전략]\n1. 액션: 단순히 감기보다 2초간 멈추는 '스테이' 동작에서 90%의 입질이 옵니다.\n2. 색상: 물이 맑을 때는 내추럴 컬러, 탁할 때는 화려한 차트 컬러가 진리입니다.\n3. 공략: 수중 암초나 복잡한 지형을 루어로 천천히 훑어보는 인내심이 필요합니다.\n\n내가 던진 루어에 확신을 가지세요. 그 확신이 바로 손맛으로 이어집니다!`
        };
        
        const body = highProTips[data.randomTopic] || "항상 대물을 꿈꾸는 당신의 열정적인 낚시 여정을 응원합니다!";
        return `오늘의 낚시 프리미엄 리포트! 🎣\n\n${body}\n\n오늘도 안전하고 즐겁게 선상 혹은 갯바위에서 최고의 하루를 보내시길 바랍니다!\n\n#낚시 #바다낚시 #낚스타그램 #대물기원 #생활낚시 #도시어부 #루어낚시 #민물낚시 #붕어낚시 #낚시꿀팁 #주말취미 #힐링 #낚시장비 #매듭법 #강태공 #바다낚시포인트 #만선기원`;
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
            console.log('--- 미디어 준비 완료 (30초 대기) ---');
            await new Promise(resolve => setTimeout(resolve, 30000));
            await axios.post(`${this.baseUrl}/${this.igUserId}/media_publish`, {
                creation_id: creationId, access_token: this.accessToken
            });
            return true;
        } catch (error) { console.error('[오류]:', error.response?.data || error.message); throw error; }
    }
}

async function main() {
    console.log('--- [버전 22.0 - 무결점 낚시 자동화] 가동 ---');
    
    // 🚩 고양이/망사옷 절대 없는 '엄선된 낚시 전문' 사진 리스트 (수동 검증 완료)
    const images = {
        gear: "https://images.pexels.com/photos/206064/pexels-photo-206064.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080", // 낚시 릴
        fish: "https://images.pexels.com/photos/2131910/pexels-photo-2131910.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080", // 잡힌 물고기
        boat: "https://images.pexels.com/photos/731706/pexels-photo-731706.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080",  // 낚시 배/바다
        lure: "https://images.pexels.com/photos/294674/pexels-photo-294674.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080",  // 낚시 도구함
        angler: "https://images.pexels.com/photos/2131911/pexels-photo-2131911.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080" // 낚시 장비 셋팅
    };

    const topicPool = [
        { topic: "겨울철 대어 낚는 비법과 장비 셋팅 가이드", type: 'fish' },
        { topic: "서해안/동해안 물때 보는 법과 황금 피크타임", type: 'boat' },
        { topic: "낚시꾼이 꼭 알아야 할 튼튼한 매듭법 3가지", type: 'gear' },
        { topic: "대물을 유혹하는 루어 선택과 운영 노하우", type: 'lure' },
        { topic: "낚시 시즌별 원줄과 목줄 장비 셋팅 노하우", type: 'angler' }
    ];
    
    const selected = topicPool[Math.floor(Math.random() * topicPool.length)];
    const imageUrl = images[selected.type];

    const scraper = new FishingScraper();
    const news = await scraper.fetchLatestFishingNews();
    const data = { news, randomTopic: selected.topic };

    const ai = new FishingAI(process.env.GEMINI_API_KEY);
    const caption = await ai.generateInstagramContent(data);
    console.log(`[분석] 오늘의 주제: ${selected.topic}`);

    if (process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_USER_ID) {
        const publisher = new InstagramPublisher(process.env.INSTAGRAM_ACCESS_TOKEN, process.env.INSTAGRAM_USER_ID);
        await publisher.publishPost(imageUrl, caption); 
        console.log('--- 축하합니다! 모든 장애물을 극복하고 포스팅 성공! ---');
    }
}

main().catch(err => { console.error('최종 실패:', err.message); process.exit(1); });
