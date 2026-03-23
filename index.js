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
    
    // 데이터가 없을 때를 대비한 '오늘의 랜덤 주제' 추가 (다양성 확보)
    const dailyTopics = [
        "겨울철 대어 낚는 비법", "낚싯대 관리법", "초보자를 위한 채비 추천", 
        "오늘의 추천 낚시 장비", "낚시 매듭법 꿀팁", "바다낚시 안전 수칙",
        "낚시꾼들이 자주 하는 실수", "물때 보는 법 기초", "손맛 좋은 어종 추천"
    ];
    data.randomTopic = dailyTopics[Math.floor(Math.random() * dailyTopics.length)];
    
    console.log('수집 완료:', data.news.length, '개의 뉴스 발견. 주제:', data.randomTopic);

    // 2. AI 콘텐츠 생성
    if (!process.env.GEMINI_API_KEY) {
        console.error('API 키가 설정되지 않았습니다. .env 파일을 확인하세요.');
        return;
    }
    const ai = new FishingAI(process.env.GEMINI_API_KEY);
    console.log('AI 콘텐츠 생성 중...');
    const caption = await ai.generateInstagramContent(data);
    console.log('캡션 생성 완료:\n', caption);

    // 3. 사진 선정 (완벽하게 검증된 낚시 전문 이미지 10종)
    const fishingImages = [
        "https://images.pexels.com/photos/1630039/pexels-photo-1630039.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1000", // 낚시꾼
        "https://images.pexels.com/photos/2288107/pexels-photo-2288107.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1000", // 장비와 낚시꾼
        "https://images.pexels.com/photos/2131910/pexels-photo-2131910.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1000", // 물고기 손맛
        "https://images.pexels.com/photos/206064/pexels-photo-206064.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1000",  // 릴
        "https://images.pexels.com/photos/294674/pexels-photo-294674.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1000",  // 미끼
        "https://images.pexels.com/photos/1151280/pexels-photo-1151280.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1000", // 노을 속 낚싯대
        "https://images.pexels.com/photos/1113926/pexels-photo-1113926.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1000", // 찌
        "https://images.pexels.com/photos/731706/pexels-photo-731706.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1000",   // 평화로운 낚시
        "https://images.pexels.com/photos/1484196/pexels-photo-1484196.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1000", // 배낚시
        "https://images.pexels.com/photos/937985/pexels-photo-937985.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1000"    // 낚시 가방과 용품
    ];
    // 매번 다른 이미지가 나오도록 보장하기 위해 초 단위 시간을 시드로 사용
    const seed = new Date().getSeconds();
    const randomImage = fishingImages[(seed + Math.floor(Math.random() * 10)) % fishingImages.length];
    const imageUrl = process.env.DEFAULT_IMAGE_URL || randomImage;

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
