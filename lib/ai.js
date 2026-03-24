const { GoogleGenerativeAI } = require("@google/generative-ai");

class FishingAI {
    constructor(apiKey) {
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async generateInstagramContent(data) {
        try {
            const modelNames = ["gemini-1.5-flash-latest", "gemini-1.5-flash", "gemini-pro"];
            let model;
            
            for (const name of modelNames) {
                try {
                    model = this.genAI.getGenerativeModel({ model: name });
                    break;
                } catch (e) { continue; }
            }
            
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
                "오늘의 낚시 이슈를 정리해 드립니다. 즐거운 하루 되세요! 🐟 #민물낚시 #붕어낚시 #대물"
            ];
            return fallbacks[Math.floor(Math.random() * fallbacks.length)];
        }
    }
}

module.exports = FishingAI;
