require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');

/**
 * 🎣 검증된 고정 낚시 이미지 리스트 (100% 낚시, .jpg 형식)
 */
const FISHING_IMAGES = {
    fish: "https://images.unsplash.com/photo-1544434077-f2730107291a?q=80&w=1080&h=1080&auto=format&fit=crop&fm=jpg", // 물고기 손맛
    sea: "https://images.pexels.com/photos/1651475/pexels-photo-1651475.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080", // 바다낚시 전경
    gear: "https://images.pexels.com/photos/206064/pexels-photo-206064.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080",   // 낚시 릴
    lure: "https://images.pexels.com/photos/425313/pexels-photo-425313.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1080"    // 화려한 루어
};

class FishingBot {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
        this.accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
        this.igUserId = process.env.INSTAGRAM_USER_ID;
        this.baseUrl = `https://graph.facebook.com/v20.0`;
    }

    async generateContent(topic) {
        console.log(`[AI] 주제 '${topic}' 분석 시작...`);
        try {
            // SDK의 404 에러를 방지하기 위해 API로 직접 요청합니다.
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
            const { data } = await axios.post(url, {
                contents: [{ parts: [{ text: `주제 '${topic}'에 대해 낚시 전문가로서 15줄 이상의 인스타그램 글을 작성해줘. 실무 비법을 포함하고 해시태그 20개를 달아줘. [Caption] 결과만 출력.` }] }]
            });
            const text = data.candidates[0].content.parts[0].text;
            if (text && text.length > 50) return text;
        } catch (e) {
            console.log('[AI알림] AI 직접 호출 실패, 내장된 전문가 가이드를 사용합니다.');
        }

        // --- 🎣 AI 실패 시 나가는 주제별 전문가 가이드 ---
        const fallbacks = {
            "겨율철 대어 낚는 비법과 장비 셋팅 가이드": "겨울 대물 낚시는 수온과의 싸움! ❄️\n1. 수심 7m 이상 바닥권 집중 공략.\n2. 저수온기 예민한 입질에 대응하는 저부력 채비 필수.\n3. 미끼는 작게, 기다림은 길게 하세요.\n묵묵히 공략하는 자에게 대물이 찾아옵니다.",
            "서해안/동해안 물때 보는 법과 황금 피크타임": "물때가 조과를 결정합니다! 🌊\n1. 7물~10물 사이가 가장 좋은 활동기입니다.\n2. 초들물 전후 1시간을 절대 놓치지 마세요.\n3. 물의 흐름이 멈췄다 도는 찰나가 황금 시간입니다.",
            "낚시꾼이 꼭 알아야 할 튼튼한 매듭법 3가지": "매듭 하나가 인생 대어를 가릅니다! 🪢\n1. 유니노트(범용성 1위)\n2. 클린치노트(바늘결합 정석)\n3. 팔로마노트(최고 결속력)\n매듭에 정성을 쏟아야 대어를 낚습니다!"
        };
        const body = fallbacks[topic] || "항상 대물을 꿈꾸는 당신의 낚시 여정을 응원합니다!";
        return `오늘의 낚시 전문 리포트! 🎣\n\n${body}\n\n오늘도 안전하고 즐거운 손맛 보시길 바랍니다!\n\n#낚시 #바다낚시 #낚스타그램 #대물기원 #생활낚시 #도시어부 #루어낚시 #민물낚시 #붕어낚시 #낚시꿀팁 #취미 #힐링 #만선기원`;
    }

    async publishPost(imageUrl, caption) {
        try {
            console.log(`[시도] 사진 전송: ${imageUrl}`);
            const res = await axios.post(`${this.baseUrl}/${this.igUserId}/media`, {
                image_url: imageUrl, caption: caption, access_token: this.accessToken
            });
            const creationId = res.data.id;
            console.log('--- 전송 처리 대기 (30초) ---');
            await new Promise(r => setTimeout(r, 30000));
            await axios.post(`${this.baseUrl}/${this.igUserId}/media_publish`, {
                creation_id: creationId, access_token: this.accessToken
            });
            return true;
        } catch (error) { 
            console.error('[최종 오류 상세]:', error.response?.data || error.message); 
            throw error;
        }
    }
}

async function main() {
    console.log('--- [버전 24.0 - 최종 완성 무결점] 가동 ---');
    
    const topicPool = [
        { topic: "겨율철 대어 낚는 비법과 장비 셋팅 가이드", type: 'fish' },
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
        console.log('--- 축하합니다! 드디어 완벽하게 포스팅에 성공했습니다! ---');
    }
}

main().catch(err => { console.error('실패:', err.message); process.exit(1); });
