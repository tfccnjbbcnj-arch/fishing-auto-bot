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
            이를 바탕으로 인스타그램 포스팅 문구를 만들어줘. 낚시꾼 말투로 하고 해시태그 15개 이상 포함해서 [Caption]만 출력해.
            만약 뉴스가 없으면 '오늘도 즐거운 낚시하세요'를 응용해줘.
            `;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('AI 생성 오류:', error);
            return "오늘도 대물 낚으시길 바랍니다! 🎣 #낚시 #바다낚시 #대물기원 #낚시스타그램";
        }
    }
}

module.exports = FishingAI;
