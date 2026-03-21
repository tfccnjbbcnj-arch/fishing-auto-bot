require('dotenv').config();
const FishingScraper = require('./lib/scraper');
const FishingAI = require('./lib/ai');
const InstagramPublisher = require('./lib/publisher');

async function main() {
    console.log('--- 낚시 자동화 봇 가동 시작 ---');
    const scraper = new FishingScraper();
    const data = await scraper.getAllData();
    console.log('수집 완료:', data.news.length, '개의 뉴스 발견');

    const ai = new FishingAI(process.env.GEMINI_API_KEY || '');
    const caption = await ai.generateInstagramContent(data);
    console.log('캡션 생성 완료.');

    // 이제 '산속 도로'가 아닌 '진짜 낚시 사진' 주소입니다! (1:1 정사각형)
    const imageUrl = "https://images.pexels.com/photos/1630039/pexels-photo-1630039.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1000";

    const publisher = new InstagramPublisher(process.env.INSTAGRAM_ACCESS_TOKEN, process.env.INSTAGRAM_USER_ID);
    console.log('인스타그램 업로드 중...');
    const result = await publisher.publishPost(imageUrl, caption);
    console.log('🎉 축하드립니다! 진짜 낚시 포스팅 성공! ID:', result.id);
}
main().catch(err => { console.error('에러:', err); process.exit(1); });
