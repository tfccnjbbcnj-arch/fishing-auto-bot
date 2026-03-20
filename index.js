require('dotenv').config();
const FishingScraper = require('./lib/scraper');
const FishingAI = require('./lib/ai');
const InstagramPublisher = require('./lib/publisher');

async function main() {
    console.log('--- 낚시 자동화 봇 가동 시작 ---');
    
    const scraper = new FishingScraper();
    const data = await scraper.getAllData();
    console.log('수집 완료:', data.news.length, '개의 뉴스 발견');

    if (!process.env.GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY가 없습니다.');
        return;
    }

    const ai = new FishingAI(process.env.GEMINI_API_KEY);
    console.log('AI 콘텐츠 생성 중...');
    const caption = await ai.generateInstagramContent(data);
    console.log('캡션 생성 완료:\n', caption);

    const imageUrl = "https://images.unsplash.com/photo-1529230117712-640ff21efffd?auto=format&fit=crop&q=80&w=1000";

    if (process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_USER_ID) {
        const publisher = new InstagramPublisher(
            process.env.INSTAGRAM_ACCESS_TOKEN,
            process.env.INSTAGRAM_USER_ID
        );
        console.log('인스타그램 업로드 중...');
        const result = await publisher.publishPost(imageUrl, caption);
        console.log('🎉 업로드 성공! ID:', result.id);
    }

    console.log('--- 작업 완료 ---');
}

main().catch(err => {
    console.error('치명적 오류 발생:', err);
    process.exit(1);
});
