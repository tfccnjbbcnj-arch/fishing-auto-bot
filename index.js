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
        const modelNames = ["gemini-1.5-flash", "gemini-pro"];
        for (const name of modelNames) {
            try {
                const model = this.genAI.getGenerativeModel({ model: name });
                const result = await model.generateContent(`주제 '${data.randomTopic}'에 대해 낚시 전문가로서 10줄 이상의 정보를 제공하는 인스타그램 게시물을 작성해줘. 실무적인 비법을 상세히 포함하고 해시태그 20개를 달아줘. [Caption] 결과만 출력.`);
                const text = result.response.text();
                if (text && text.length > 50) return text;
            } catch (e) { console.log(`[AI] ${name} 연결 시도 중...`); }
        }
        
        // 🎣 AI 실패 시에도 "와, 진짜 전문가가 썼나?" 싶을 정도의 상세한 주제별 정답 가이드
        const professionalCaptions = {
            "겨울철 대어 낚는 비법과 장비 셋팅 가이드": `겨울 대물을 노린다면 가장 중요한 것은 '수온'입니다! ❄️\n\n1. 포인트: 수온이 1도라도 높은 수심 7~10m 이상의 깊은 바닥층을 노리세요.\n2. 장비: 저수온기 예민한 입질을 위해 0.8호 이하의 가는 원줄과 고감도 찌 사용이 필수입니다.\n3. 미끼: 활동성이 떨어진 고기들을 위해 부드러운 크릴이나 집어제를 충분히 활용하세요.\n\n겨울 낚시는 기다림의 미학입니다. 장비 셋팅부터 정교하게 준비해야 대물 손맛을 볼 수 있습니다!`,
            "서해안/동해안 물때 보는 법과 황금 피크타임": `조황의 8할은 물때가 결정합니다! 🌊\n\n1. 황금 물때: 보통 7물에서 10물 사이가 조류 소통이 원활해 대물 활성도가 가장 높습니다.\n2. 피크타임: 간조에서 만조로 바뀌는 '초들물'과 만조 전후 1시간을 집중 공략하세요.\n3. 팁: 지형지물에 따른 와류가 생기는 곳이 진정한 포인트입니다.\n\n물때표를 읽는 자가 바다를 지배합니다. 오늘도 황금 타임 사수하세요!`,
            "낚시꾼이 꼭 알아야 할 튼튼한 매듭법 3가지": `매듭이 풀려 고기를 놓치면 그만큼 허탈한 게 없죠! 🪢\n\n1. 유니노트: 어떤 채비에도 통용되는 만능 매듭법으로 반드시 숙지해야 합니다.\n2. 클린치노트: 바늘과 도래 결합 시 가장 신뢰도가 높으며 결속력이 우수합니다.\n3. 팔로마노트: 강도 면에서는 따라올 자가 없는 최강의 매듭법입니다.\n\n이 3가지만 완벽히 손에 익힌다면, 기록어와의 싸움에서도 절대 지지 않습니다!`,
            "대물을 유혹하는 루어 선택과 운영 노하우": `루어 낚시의 핵심은 '대상어의 시선을 끄는 것'입니다! 🐟\n\n1. 액션: 단순히 감는 것이 아니라 스테이와 폴링 동작을 섞어 대상어에게 먹이감을 어필하세요.\n2. 색상: 물색이 탁할 때는 화려한 차트 계열, 맑을 때는 자연스러운 내추럴 계열이 유리합니다.\n3. 운용: 수중 지형을 읽으며 바닥층부터 천천히 탐색하는 인내심이 필요합니다.\n\n루어는 믿음입니다. 내가 던진 채비에 대한 확신이 대물을 만듭니다!`
        };
        
        const body = professionalCaptions[data.randomTopic] || "오늘도 대물의 손맛을 향한 열정 가득한 출조 되시길 응원합니다!";
        return `오늘의 낚시 프리미엄 리포트! 🎣\n\n${body}\n\n오늘도 안전하고 즐겁게, 묵직한 손맛 보시길 기원합니다!\n\n#낚시 #바다낚시 #낚스타그램 #대물기원 #생활낚시 #도시어부 #루어낚시 #민물낚시 #붕어낚시 #낚시꿀팁 #주말취미 #힐링 #낚시장비 #매듭법 #강태공`;
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
            console.log('--- 미디어 준비 중 (30초 대기) ---');
            await new Promise(resolve => setTimeout(resolve, 30000));
            await axios.post(`${this.baseUrl}/${this.igUserId}/media_publish`, {
                creation_id: creationId, access_token: this.accessToken
            });
            return true;
        } catch (error) { console.error('[오류]:', error.response?.data || error.message); throw error; }
    }
}

async function main() {
    console.log('--- [버전 17.0 - 낚시 전문가 버전] 가동 시작 ---');
    
    // 검증된 사진들 (1:1 화면 비율 고정)
    const images = {
        hand_fish: "https://images.pexels.com/photos/2131910/pexels-photo-2131910.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080",
        rod_sea: "https://images.pexels.com/photos/1651475/pexels-photo-1651475.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080",
        gear_reel: "https://images.pexels.com/photos/206064/pexels-photo-206064.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080",
        gear_lure: "https://images.pexels.com/photos/425313/pexels-photo-425313.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080"
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
        console.log('--- 축하합니다! 버전 17.0 포스팅 성공! ---');
    }
}

main().catch(err => { console.error('실패:', err.message); process.exit(1); });
