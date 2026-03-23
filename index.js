require('dotenv').config();
const axios = require('axios');

/**
 * 🎣 [버전 26.5 전용] 100% 낚시 전경 및 장비만 담긴 프리미엄 이미지 15선 (정사각형 고정)
 */
const FISHING_IMAGES = [
    "https://images.pexels.com/photos/2131910/pexels-photo-2131910.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080", // 물고기를 든 손
    "https://images.pexels.com/photos/1651475/pexels-photo-1651475.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080", // 낚싯대와 바다
    "https://images.pexels.com/photos/2131911/pexels-photo-2131911.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080", // 낚시장비 셋팅
    "https://images.pexels.com/photos/425313/pexels-photo-425313.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080",  // 루어미끼
    "https://images.pexels.com/photos/294674/pexels-photo-294674.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080",  // 낚시용품 상자
    "https://images.pexels.com/photos/2288107/pexels-photo-2288107.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080", // 배 위 낚시꾼
    "https://images.pexels.com/photos/1201584/pexels-photo-1201584.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080", // 물고기 접사
    "https://images.pexels.com/photos/626162/pexels-photo-626162.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080",   // 평화로운 낚시배
    "https://images.pexels.com/photos/731706/pexels-photo-731706.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080",  // 바다낚시 실전
    "https://images.pexels.com/photos/1612461/pexels-photo-1612461.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080", // 화려한 유인용 루어
    "https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080", // 묵직한 물고기 손맛
    "https://images.pexels.com/photos/356079/pexels-photo-356079.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080",   // 호숫가 릴 낙시
    "https://images.pexels.com/photos/449627/pexels-photo-449627.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080",   // 낚시꾼 실루엣
    "https://images.pexels.com/photos/3228943/pexels-photo-3228943.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080", // 루어 바늘 접사
    "https://images.pexels.com/photos/15444342/pexels-photo-15444342.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080" // 대물 낚시의 설렘
];

class FishingBot {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
        this.accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
        this.igUserId = process.env.INSTAGRAM_USER_ID;
        this.baseUrl = `https://graph.facebook.com/v20.0`;
    }

    async generateContent(topic) {
        console.log(`[분석] '${topic}' 주제로 일간 리포트 생성 중...`);
        try {
            const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${this.apiKey}`;
            const { data } = await axios.post(url, {
                contents: [{ parts: [{ text: `낚시 전문가로서 '${topic}'에 대한 15줄 이상의 상세한 인스타그램 게시물을 작성해줘. 해시태그 20개 필수. [Caption] 결과만 출력.` }] }]
            });
            const text = data.candidates[0].content.parts[0].text;
            if (text && text.length > 50) return text;
        } catch (e) {
            console.log('[알림] AI 직접 호출 불가, 마스터 피드 사용.');
        }

        const fallbacks = {
            "겨울철 대어 낚는 비법과 장비 셋팅 가이드": "겨울 대물 낚시의 핵심은 '공략 수심'과 '인내'입니다! ❄️\n\n1. 포인트: 수온이 0.5도라도 높은 수심 7m 이상 바닥권을 훑으세요.\n2. 장비: 저수온기 예민한 입질을 위해 저부력 찌와 가는 원줄이 정석입니다.\n3. 매너: 겨울 고기는 한 번의 입질이 소중하니 끝까지 집중하세요!\n\n장비 셋팅의 정성이 대물을 부릅니다. 안전한 겨울 낚시 즐기세요!",
            "서해안/동해안 물때 보는 법과 황금 피크타임": "물때가 조과를 결정합니다! 🌊\n\n1. 물때: 7물~10물 사이가 가장 활성도가 높습니다.\n2. 타임: 물이 들어오는 '초들물'과 물이 바뀌는 찰나를 노리세요.\n3. 팁: 지형지물을 정확히 파악해야 황금 피크타임을 사수할 수 있습니다.",
            "낚시꾼이 꼭 알아야 할 튼튼한 매듭법 3가지": "매듭 하나가 인생 기록어를 좌우합니다! 🪢\n\n1. 유니노트(전천후 만능)\n2. 클린치노트(바늘결합 정석)\n3. 팔로마노트(최강 인장강도)\n매듭을 조이기 전 침이나 물을 살짝 묻히면 더 튼튼해집니다!"
        };
        const body = fallbacks[topic] || "항상 대물을 향한 설레는 마음을 응원합니다. 대어 낚으시길 기원합니다!";
        return `오늘의 낚시 프리미엄 리포트! 🎣\n\n${body}\n\n좋은 하루 되시고, 건강하게 낚시의 즐거움을 만끽하세요!\n\n#낚시 #바다낚시 #낚스타그램 #대물기원 #생활낚시 #루어낚시 #민물낚시 #붕어낚시 #낚시꿀팁 #주말여행 #힐링 #낚시장비 #만선기원`;
    }

    async publishPost(imageUrl, caption) {
        try {
            const res = await axios.post(`${this.baseUrl}/${this.igUserId}/media`, {
                image_url: imageUrl, caption: caption, access_token: this.accessToken
            });
            const creationId = res.data.id;
            console.log('--- 전송 준비 중 (30초 대기) ---');
            await new Promise(r => setTimeout(r, 30000));
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
    console.log('--- [버전 26.5 - 15종 프리미엄 낚시 라이브러리] 가동 ---');
    
    const topicPool = [
        { topic: "겨울철 대어 낚는 비법과 장비 셋팅 가이드" },
        { topic: "서해안/동해안 물때 보는 법과 황금 피크타임" },
        { topic: "낚시꾼이 꼭 알아야 할 튼튼한 매듭법 3가지" },
        { topic: "대물을 유혹하는 루어 선택과 운영 노하우" },
        { topic: "가족과 함께 떠나는 낚시 나들이와 캠낚 명소" } // 주제도 5개로 늘렸습니다!
    ];
    
    const selectedTopic = topicPool[Math.floor(Math.random() * topicPool.length)].topic;
    // 🎣 15장의 엄선된 물고기/낚시장비 사진 중 하나가 랜덤으로 올라갑니다!
    const imageUrl = FISHING_IMAGES[Math.floor(Math.random() * FISHING_IMAGES.length)];

    const bot = new FishingBot();
    const caption = await bot.generateContent(selectedTopic);
    
    if (bot.accessToken && bot.igUserId) {
        await bot.publishPost(imageUrl, caption); 
        console.log('--- 작업 완료! 인스타그램에서 확인해보세요! ---');
    }
}

main().catch(err => { console.error('실패:', err.message); process.exit(1); });
