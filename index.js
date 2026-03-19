require('dotenv').config();
const FishingScraper = require('./lib/scraper');
const FishingAI = require('./lib/ai');
const InstagramPublisher = require('./lib/publisher');

async function main() {
    console.log('--- 낚시 자동화 봇 가동 시작 ---');
    
    // 1. 데이터 수집
    const scraper = new FishingScraper();
    console.log('데이터 수집 중...');
    const data = await scraper.getAllData();
    console.log('수집 완료:', data.news.length, '개의 뉴스 발견');

    // 2. AI 콘텐츠 생성
    if (!process.env.GEMINI_API_KEY) {
        console.error('API 키가 설정되지 않았습니다. .env 파일을 확인하세요.');
        return;
    }
    const ai = new FishingAI(process.env.GEMINI_API_KEY);
    console.log('AI 콘텐츠 생성 중...');
    const caption = await ai.generateInstagramContent(data);
    console.log('캡션 생성 완료:\n', caption);

    // 3. 사진 선정 (기본 낚시 이미지 또는 미리 준비된 이미지 URL)
    const imageUrl = process.env.DEFAULT_IMAGE_URL || "https://images.unsplash.com/photo-1544551763-47a0159f9234?auto=format&fit=crop&q=80&w=1000";

    // 4. 인스타그램 업로드
    if (process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_USER_ID) {
        const publisher = new InstagramPublisher(
            process.env.INSTAGRAM_ACCESS_TOKEN,
            process.env.INSTAGRAM_USER_ID
        );
        console.log('인스타그램 업로드 중...');
        const result = await publisher.publishPost(imageUrl, caption);
        console.log('업로드 성공! ID:', result.id);
    } else {
        console.log('인스타그램 API 정보가 없어 포스팅을 건너뜁니다. (시뮬레이션 모드)');
    }

    console.log('--- 작업 완료 ---');
}

main().catch(err => {
    console.error('치명적 오류 발생:', err);
    process.exit(1);
});
