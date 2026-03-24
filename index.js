require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');
const cheerio = require('cheerio');
const FishingScraper = require('./lib/scraper');
const FishingAI = require('./lib/ai');
const InstagramPublisher = require('./lib/publisher');

async function main() {
    console.log('--- [버전 22.1 - 이미지 및 말투 최적화] 가동 시작 ---');
    console.log(`[시간] ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} (KST)`);
    
    if (!process.env.GEMINI_API_KEY) { 
        throw new Error('필수 설정 누락: GEMINI_API_KEY가 없습니다.'); 
    }
    
    const topicPool = [
        { topic: "겨울철 대어 낚는 비법과 장비 셋팅 가이드", keywords: "fishing-lure,angler" },
        { topic: "서해안/동해안 물때 보는 법과 황금 피크타임", keywords: "fishing-boat,sea-fishing" },
        { topic: "낚시꾼이 꼭 알아야 할 튼튼한 매듭법 3가지", keywords: "fishing-hook,fishing-gear" },
        { topic: "대물을 유혹하는 루어 선택과 운영 노하우", keywords: "bass-fishing,lure-fishing" }
    ];
    
    const selected = topicPool[Math.floor(Math.random() * topicPool.length)];
    
    // 🚩 이미지 검색 키워드 정교화 (물개 등 방지)
    let imageUrl = `https://loremflickr.com/1080/1080/${selected.keywords}/all?lock=${Math.floor(Date.now() / 86400000)}`;
    const fallbackImageUrl = process.env.DEFAULT_IMAGE_URL || "https://images.unsplash.com/photo-1511524233157-8979313ea2be?q=80&w=1080&auto=format&fit=crop"; 
    
    console.log(`[미디어] 시도 이미지: ${imageUrl}`);

    const scraper = new FishingScraper();
    const news = await scraper.fetchLatestFishingNews();

    const ai = new FishingAI(process.env.GEMINI_API_KEY);
    const caption = await ai.generateInstagramContent({ news, randomTopic: selected.topic });

    if (process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_USER_ID) {
        const publisher = new InstagramPublisher(process.env.INSTAGRAM_ACCESS_TOKEN, process.env.INSTAGRAM_USER_ID);
        try {
            await publisher.publishPost(imageUrl, caption); 
            console.log('--- ✨ 포스팅 최종 성공 ---');
        } catch (postError) {
            console.warn(`[경고] 기본 이미지 실패. 폴백 이미지 재시도...`);
            await publisher.publishPost(fallbackImageUrl, caption);
            console.log('--- ✨ 폴백 이미지로 포스팅 성공 ---');
        }
    }
}

main().catch(err => { 
    console.error('❌ 최종 실패:', err.message);
    process.exit(1); 
});
