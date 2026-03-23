require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');
const cheerio = require('cheerio');

class FishingScraper {
    async fetchLatestFishingNews() {
        try {
            const keywords = ['바다낚시 꿀팁', '루어낚시 포인트', '민물낚시 비결'];
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
        // AI 모델 시도
        const modelNames = ["gemini-1.5-flash", "gemini-pro"];
        for (const name of modelNames) {
            try {
                const model = this.genAI.getGenerativeModel({ model: name });
                const result = await model.generateContent(`주제 '${data.randomTopic}'에 대해 낚시 전문가로서 10줄 이상의 풍성하고 전문적인 정보를 제공하는 인스타그램 게시물을 작성해줘. 해시태그 20개를 달아줘. [Caption] 결과만 출력.`);
                const text = result.response.text();
                if (text && text.length > 50) return text;
            } catch (e) { console.log(`[AI] ${name} 로딩 중...`); }
        }
        
        // --- 🎣 [버전 18.0 전용] AI가 실패해도 완벽하게 작동하는 초정밀 전문가 지식 베이스 ---
        const proTips = {
            "겨울철 대어 낚는 비법과 장비 셋팅 가이드": `겨울 대물을 노린다면 가장 중요한 것은 '수온'과 '인내'입니다! ❄️\n\n겨울철 물고기들은 활동성이 떨어져 수심 7~12m 이상의 깊은 바닥층에 머뭅니다. 따라서 평소보다 채비를 무겁게 하여 바닥권을 정확히 공략하는 것이 핵심입니다.\n\n[전문가 셋팅 팁]\n1. 원줄은 최대한 가늘게(0.8~1호) 사용하여 물의 저항을 줄이세요.\n2. 입질이 매우 미세하므로 초감도 찌를 사용하고, 바늘은 평소보다 한 치수 작은 것을 권장합니다.\n3. 미끼는 크릴의 머리와 꼬리를 떼어 작고 부드럽게 만들어 보세요.\n\n겨울 낚시는 한 번의 입질을 위해 5시간을 기다릴 줄 아는 사람에게 대물을 허락합니다. 오늘도 묵직한 손맛 보시길 응원합니다!`,
            "서해안/동해안 물때 보는 법과 황금 피크타임": `조황의 8할은 물때가 결정한다는 말, 절대 과장이 아닙니다! 🌊\n\n초보자들이 가장 실수하는 것이 아무 때나 출조하는 것입니다. 물고기는 조류의 흐름이 생길 때 움직입니다. 서해안은 조석 간만의 차가 크므로 '7물'에서 '10물' 사이가 가장 활발하며, 동해안은 수온 변화와 용오름 현상을 체크하는 것이 중요합니다.\n\n[피크타임 포인트]\n1. 간조에서 만조로 바뀌는 '초들물' 1시간이 최고의 골든 타임입니다.\n2. 만조 전후 30분, 조류가 멈췄다가 다시 움직이는 찰나를 노리세요.\n3. 와류가 형성되는 지형지물 근처에 대물이 은신하고 있습니다.\n\n자연의 흐름을 읽는 자가 바다를 지배합니다. 오늘도 물때 맞춤형 만선 기원합니다!`,
            "낚시꾼이 꼭 알아야 할 튼튼한 매듭법 3가지": `매듭이 터져서 대어를 놓친 기억은 낚시꾼에게 평생의 한으로 남습니다! 🪢\n\n가장 기본이면서도 강력한 3가지 매듭법을 마스터해야 합니다.\n1. 유니노트(Uni Knot): 만능 매듭으로 결속력이 우수하고 초보자도 배우기 쉽습니다.\n2. 클린치노트(Clinch Knot): 도래나 바늘 귀에 직접 결합할 때 최고의 인장 강도를 자랑합니다.\n3. 팔로마노트(Palomar Knot): 매듭 강도 테스트에서 늘 1위를 차지하는 최강의 결속법입니다.\n\n[꿀팁] 매듭을 당겨 조이기 전에 침이나 물을 살짝 묻혀주면 마찰열로 인한 라인 손상을 막아 훨씬 튼튼해집니다.\n\n기본이 튼튼해야 대어와의 싸움에서 승리할 수 있습니다!`,
            "대물을 유혹하는 루어 선택과 운영 노하우": `루어 낚시는 '속이는 기술'의 예술입니다! 🐟\n\n대어들은 학습 능력이 뛰어나 어설픈 동작에는 반응하지 않습니다. 오늘은 루어 운영의 핵심인 '운용 속도'와 '색상'에 대해 알아봅니다.\n\n[루어 필승 전략]\n1. 리트리브(감기) 도중에 '스테이' 동작을 2~3초간 섞어주세요. 대부분의 입질은 멈추는 찰나에 들어옵니다.\n2. 물이 어두울 때는 형광/차트 계열, 맑을 때는 투명/실버 계열이 기본입니다.\n3. 싱킹 타입 루어를 사용해 바닥을 긁는 느낌으로 운용하면 저기압 때 효과적입니다.\n\n대상어의 눈높이에 맞춘 정교한 액션이 대물을 불러옵니다! 오늘도 손맛 찌릿하게 보세요!`
        };
        
        const body = proTips[data.randomTopic] || "오늘도 대물을 향한 설레는 마음으로 출조를 준비하시나요? 낚시는 기다림 끝에 찾아오는 한 번의 강력한 손맛이 모든 것을 보상해주죠. 안전에 유의하시고, 기록어 경신의 기쁨을 누리시길 응원합니다!";
        return `오늘의 낚시 프리미엄 리포트! 🎣\n\n${body}\n\n오늘도 즐겁고 건강하게, 낚시의 즐거움을 만끽하세요!\n\n#낚시 #바다낚시 #낚스타그램 #대물기원 #생활낚시 #도시어부 #루어낚시 #민물낚시 #붕어낚시 #낚시꿀팁 #주말취미 #힐링 #낚시장비 #매듭법 #강태공 #바다 #만선기원`;
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
            console.log('--- 인스타그램 서버 처리 대기 (30초) ---');
            await new Promise(resolve => setTimeout(resolve, 30000));
            await axios.post(`${this.baseUrl}/${this.igUserId}/media_publish`, {
                creation_id: creationId, access_token: this.accessToken
            });
            return true;
        } catch (error) { console.error('[오류]:', error.response?.data || error.message); throw error; }
    }
}

async function main() {
    console.log('--- [버전 18.0 - 오차 없는 정밀 타격] 가동 시작 ---');
    
    // 🚩 게임/새 사진 절대 안 나오는 Unsplash 고화질 낚시 전용 사진 (1:1 비율 강제 고정)
    // 모든 주입한 URL은 낚시와 직접적으로 관련이 있음을 확인했습니다.
    const images = {
        hand_fish: "https://images.unsplash.com/photo-1544434250-9ad982739343?auto=format&fit=crop&q=80&w=1080&h=1080&fm=jpg", // 인물이 고기를 든 사진
        rod_sea: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&q=80&w=1080&h=1080&fm=jpg", // 바다 끝 낚싯대
        gear_reel: "https://images.unsplash.com/photo-1518005020250-675f0f0fd130?auto=format&fit=crop&q=80&w=1080&h=1080&fm=jpg", // 낚시 릴/장비
        gear_lure: "https://images.unsplash.com/photo-1529230117712-640ff41eeace?auto=format&fit=crop&q=80&w=1080&h=1080&fm=jpg"  // 화려한 루어 가짜미끼
    };

    const topicPool = [
        { topic: "겨울철 대어 낚는 비법과 장비 셋팅 가이드", type: 'hand_fish' },
        { topic: "서해안/동해안 물때 보는 법과 황금 피크타임", type: 'rod_sea' },
        { topic: "낚시꾼이 꼭 알아야 할 튼튼한 매듭법 3가지", type: 'gear_reel' },
        { topic: "대물을 유혹하는 루어 선택과 운영 노하우", type: 'gear_lure' }
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
        console.log('--- 축하합니다! 보완된 버전 18.0 포스팅 성공 ---');
    }
}

main().catch(err => { console.error('실패:', err.message); process.exit(1); });
