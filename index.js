require('dotenv').config();
const axios = require('axios');

/**
 * 🎣 [검증] 인스타그램이 100% 받아들이는 Pexels 직접 JPEG 주소 (버전 16.0 성공 규격)
 */
const FISHING_IMAGES = {
    fish: "https://images.pexels.com/photos/2131910/pexels-photo-2131910.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080", // 물고기
    sea: "https://images.pexels.com/photos/1651475/pexels-photo-1651475.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080",  // 바다낚시
    gear: "https://images.pexels.com/photos/2131911/pexels-photo-2131911.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080",  // 낚시장비
    lure: "https://images.pexels.com/photos/425313/pexels-photo-425313.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080"    // 루어
};

class FishingBot {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
        this.accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
        this.igUserId = process.env.INSTAGRAM_USER_ID;
        this.baseUrl = `https://graph.facebook.com/v20.0`;
    }

    async generateContent(topic) {
        console.log(`[분석] '${topic}' 주제로 게시글 작성 중...`);
        try {
            // API 직접 호출 방식을 유지하여 모델 404 에러를 방지합니다.
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
            const { data } = await axios.post(url, {
                contents: [{ parts: [{ text: `낚시 전문가로서 '${topic}'에 대한 15줄 이상의 상세한 인스타그램 글을 작성해줘. 해시태그 20개 포함. [Caption] 결과만 출력.` }] }]
            });
            const text = data.candidates[0].content.parts[0].text;
            if (text && text.length > 50) return text;
        } catch (e) {
            console.log('[알림] AI 응답 지연으로 인해 준비된 전문가 가이드를 사용합니다.');
        }

        // --- 🎣 주제별 초정밀 전문가 가이드 (AI 실패 시 사용) ---
        const fallbacks = {
            "겨울철 대어 낚는 비법과 장비 셋팅 가이드": `겨울 대물 낚시는 수온과의 싸움! ❄️\n\n1. 포인트: 수심 7m 이상 바닥권 집중 공략이 필수입니다.\n2. 장비: 예민한 저수온기 입질에 대응하는 저부력 채비를 준비하세요.\n3. 팁: 미끼는 작게 하되 인내심은 길게 가져야 대물을 만납니다.\n\n묵묵히 기다리는 자에게 바다는 대물을 허락합니다!`,
            "서해안/동해안 물때 보는 법과 황금 피크타임": `낚시의 8할은 물때가 결정합니다! 🌊\n\n1. 물때: 7물~10물 사이가 조류 소통이 가장 좋아 대물 활성도가 높습니다.\n2. 타임: 간조에서 만조로 바뀌는 '초들물' 전후 1시간을 집중하세요.\n3. 비결: 물의 흐름이 멈췄다 다시 도는 찰나가 황금 시간입니다!`,
            "낚시꾼이 꼭 알아야 할 튼튼한 매듭법 3가지": `매듭 하나가 인생 대어를 가릅니다! 🪢\n\n1. 유니노트: 범용성 1위, 모든 채비의 기본입니다.\n2. 클린치노트: 바늘 결합 시 가장 신뢰도가 높습니다.\n3. 팔로마노트: 최강의 결속력으로 대물과의 힘싸움에 유리합니다.\n\n정교한 매듭이 당신의 조과를 바꿉니다!`
        };
        const body = fallbacks[topic] || "항상 대물을 꿈꾸는 당신의 낚시 여정을 응원합니다! 안전한 출조 되세요.";
        return `오늘의 낚시 전문 리포트! 🎣\n\n${body}\n\n오늘도 묵직한 손맛 보시길 기원합니다!\n\n#낚시 #바다낚시 #낚스타그램 #대물기원 #생활낚시 #도시어부 #루어낚시 #민물낚시 #붕어낚시 #낚시꿀팁 #만선기원`;
    }

    async publishPost(imageUrl, caption) {
        try {
            console.log(`[전송] ${imageUrl}`);
            const res = await axios.post(`${this.baseUrl}/${this.igUserId}/media`, {
                image_url: imageUrl, caption: caption, access_token: this.accessToken
            });
            const creationId = res.data.id;
            console.log('--- 인스타그램 서버 처리 대기 (30초) ---');
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
    console.log('--- [버전 25.0 - 성공 공식 복구] 가동 ---');
    
    const topicPool = [
        { topic: "겨울철 대어 낚는 비법과 장비 셋팅 가이드", type: 'fish' },
        { topic: "서해안/동해안 물때 보는 법과 황금 피크타임", type: 'sea' },
        { topic: "낚시꾼이 꼭 알아야 할 튼튼한 매듭법 3가지", type: 'gear' },
        { topic: "대물을 유혹하는 루어 선택과 운영 노하우", type: 'lure' }
    ];
    
    const selected = topicPool[Math.floor(Math.random() * topicPool.length)];
    const imageUrl = FISHING_IMAGES[selected.type];

    const bot = new FishingBot();
    const caption = await bot.generateContent(selected.topic);
    
    if (bot.accessToken && bot.igUserId) {
        await bot.publishPost(imageUrl, caption); 
        console.log('--- 축하합니다! 드디어 포스팅에 성공했습니다! ---');
    }
}

main().catch(err => { console.error('실패:', err.message); process.exit(1); });
