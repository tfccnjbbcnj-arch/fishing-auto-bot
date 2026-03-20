const { GoogleGenerativeAI } = require("@google/generative-ai");

class FishingAI {
    constructor(apiKey) {
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async generateInstagramContent(data) {
        try {
            const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            
            const prompt = `
            다음은 최신 낚시 뉴스 및 기상 정보입니다:
            \${JSON.stringify(data, null, 2)}

            이 정보를 바탕으로 아래 조건에 맞춰 인스타그램 게시물을 작성해줘:
            1. 낚시꾼들이 좋아할 만한 친근하고 흥미로운 말투 선택 (인플루언서 스타일).
            2. "오늘의 낚시 이슈" 라는 느낌으로 핵심 내용 요약.
            3. 적절한 이모지 사용.
            4. 인기 있는 낚시 관련 해시태그 15개 이상 포함.
            5. 출력 형식은 오로지 [Caption] 만 반환해줘.
            
            만약 뉴스 데이터가 비어있다면, "오늘도 즐거운 낚시 여행 떠나볼까요?" 라는 느낌으로 범용적인 낚시 권장 글을 작성해줘.
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('AI 생성 오류 상세:', error);
            return "오늘도 대물 낚으시길 바랍니다! 🎣 #낚시 #바다낚시 #낚시스타그램 #대물기원";
        }
    }
}

module.exports = FishingAI;
