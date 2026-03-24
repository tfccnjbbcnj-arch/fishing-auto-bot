require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');
const cheerio = require('cheerio');
const FishingScraper = require('./lib/scraper');
const FishingAI = require('./lib/ai');
const InstagramPublisher = require('./lib/publisher');

async function main() {
    console.log('--- [버전 22.0 - 안정화 강화 버전] 가동 시작 ---');
    console.log(`[시간] ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} (KST)`);
    
    // 환경변수 체크 (보안상 일부 마스킹)
    console.log('[설정] GEMINI_API_KEY 존재여부:', !!process.env.GEMINI_API_KEY);
    console.log('[설정] INSTAGRAM_USER_ID 존재여부:', !!process.env.INSTAGRAM_USER_ID);
    console.log('[설정] INSTAGRAM_ACCESS_TOKEN 존재여부:', !!process.env.INSTAGRAM_ACCESS_TOKEN);
    console.log('[설정] DEFAULT_IMAGE_URL 존재여부:', !!process.env.DEFAULT_IMAGE_URL);

    if (!process.env.GEMINI_API_KEY) { 
        throw new Error('필수 설정 누락: GEMINI_API_KEY가 없습니다. GitHub 브랜치의 Secrets를 확인하세요.'); 
    }
    
    const topicPool = [
        { topic: "겨울철 대어 낚는 비법과 장비 셋팅 가이드", keywords: "fishing,catch" },
        { topic: "서해안/동해안 물때 보는 법과 황금 피크타임", keywords: "sea,fishing,boat" },
        { topic: "낚시꾼이 꼭 알아야 할 튼튼한 매듭법 3가지", keywords: "fishing,gear" },
        { topic: "대물을 유혹하는 루어 선택과 운영 노하우", keywords: "fishing,lure" }
    ];
    
    const selected = topicPool[Math.floor(Math.random() * topicPool.length)];
    
    // 🚩 이미지 소스 안정화: loremflickr 실패 대비
    let imageUrl = `https://loremflickr.com/1080/1080/${selected.keywords}/all?lock=${Math.floor(Date.now() / 86400000)}`;
    const fallbackImageUrl = process.env.DEFAULT_IMAGE_URL || "https://images.unsplash.com/photo-1511524233157-8979313ea2be?q=80&w=1080&auto=format&fit=crop"; 
    
    console.log(`[미디어] 시도할 이미지 URL: ${imageUrl}`);

    const scraper = new FishingScraper();
    console.log('[동작] 네이버 뉴스 스크래핑 시작...');
    const news = await scraper.fetchLatestFishingNews();
    console.log(`[결과] 뉴스 수집 건수: ${news.length}건`);

    const ai = new FishingAI(process.env.GEMINI_API_KEY);
    console.log('[동작] Gemini AI 캡션 생성 중...');
    const caption = await ai.generateInstagramContent({ news, randomTopic: selected.topic });
    console.log(`[결과] 캡션 길이: ${caption.length}자 (준비 완료)`);

    if (process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_USER_ID) {
        console.log('[동작] 인스타그램 API 포스팅 전송 요청 중...');
        const publisher = new InstagramPublisher(process.env.INSTAGRAM_ACCESS_TOKEN, process.env.INSTAGRAM_USER_ID);
        try {
            await publisher.publishPost(imageUrl, caption); 
            console.log('--- ✨ 축하합니다! 포스팅 최종 성공 ---');
        } catch (postError) {
            console.warn(`[경고] 기본 이미지 전송 실패. 폴백 이미지로 재시도합니다... Error: ${postError.message}`);
            // 폴백 이미지로 재시도
            try {
                await publisher.publishPost(fallbackImageUrl, caption);
                console.log('--- ✨ 폴백 이미지로 포스팅 최종 성공 ---');
            } catch (retryError) {
                throw new Error(`포스팅 최종 실패 (이미지 서비스 및 폴백 모두 불가): ${retryError.message}`);
            }
        }
    } else {
        console.log('[참고] 인스타그램 설정이 없어 실제 포스팅은 건너뛰었습니다. (개발 모드)');
    }
}

main().catch(err => { 
    console.error('\n' + '='.repeat(40));
    console.error('❌ 포스팅 가동 중 최종 실패');
    console.error('원인:', err.message);
    console.error('='.repeat(40));
    process.exit(1); 
});
