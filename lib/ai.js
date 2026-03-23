const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Gemini API를 사용하여 수집된 데이터를 인스타그램용 콘텐츠로 변환
 */
class FishingAI {
    constructor(apiKey) {
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async generateInstagramContent(data) {
        try {
            // 모델명 시도 (v1.5 flash가 기본이지만 다양한 환경 고려)
            const modelName = "gemini-1.5-flash-latest"; 
            const model = this.genAI.getGenerativeModel({ model: modelName });
            
            const styles = ["유머러스한", "진중한 전문가", "엄청 신난", "감성적인", "짧고 강렬한"];
            const randomStyle = styles[Math.floor(Math.random() * styles.length)];
            
            const prompt = `
            다음은 오늘의 낚시 관련 정보입니다:
            ${JSON.stringify(data, null, 2)}

            위 정보를 바탕으로 인스타그램 게시물을 작성해줘:
            1. 말투 컨셉: ${randomStyle} 낚시 인플루언서 스타일.
            2. 주요 내용 요약과 함께 적절한 조언(꿀팁) 포함.
            3. 매번 다른 표현을 사용하고, 해시태그 15개 이상 포함.
            4. 출력 형식은 [Caption] 만 반환.
            
            만약 뉴스 정보가 없다면, '${data.randomTopic}' 주제로 재미있는 이야기를 만들어줘.
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('AI 생성 오류 상세:', error);
            const fallbacks = [
                "오늘도 대물 낚으러 떠나볼까요? 🎣 #낚시 #바다낚시 #대물기원 #낚시스타그램",
                "출조 전 기상 체크는 필수! 안전한 낚시 하세요. 🌊 #낚시광 #바다낚시 #루어낚시 #손맛",
                "오늘의 낚시 이슈를 정리해 드립니다. 즐거운 하루 되세요! 🐟 #민물낚시 #붕어낚시 #대물",
                "낚시는 기다림의 미학! 오늘도 화이팅입니다. 🌅 #일몰낙시 #힐링낚시 #취미생활",
                "멋진 풍경과 함께하는 낚시 여행, 생각만 해도 설레요! 🛶 #배낚시 #도시어부 #낚시포인트"
            ];
            return fallbacks[Math.floor(Math.random() * fallbacks.length)];
        }
    }
}
