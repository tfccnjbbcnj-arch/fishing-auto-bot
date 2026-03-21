const { GoogleGenerativeAI } = require("@google/generative-ai");

class FishingAI {
    constructor(apiKey) {
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async generateInstagramContent(data) {
        try {
            // 가장 안정적인 모델 호출 방식입니다.
            const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `
            다음은 최신 낚시 뉴스입니다:
            \${JSON.stringify(data, null, 2)}
            인스타그램 낚시꾼 말투로 포스팅 문구를 만들어줘. 해시태그 15개 이상 필수! [Caption]만 출력해.
            `;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('AI 에러:', error);
            return "오늘도 대물 낚으세요! 🎣 #낚시 #바다낚시 #대물기원 #낚스타그램";
        }
    }
}
module.exports = FishingAI;
