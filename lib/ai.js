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
            
            const prompt = `
            사용자에게 신뢰를 주는 '심도 있는 낚시 전문가'로서 인스타그램 게시물을 작성해 주세요. 
            
            [입력 데이터]
            ${JSON.stringify(data, null, 2)}

            [작성 지침]
            1. **어조**: 너무 과한 흥분보다는 진정성 있고 노련한 낚시꾼의 말투를 사용하세요. (실제 출조를 다녀온 고수의 느낌!)
            2. **내용**: 
               - 수집된 뉴스 정보가 있다면 그 내용을 비중 있게 다루며 전문가적 견해를 덧붙여 주세요.
               - 뉴스 내용이 적거나 없다면 '${data.randomTopic}' 주제로 실제 출조 경험에서 우러나온 것 같은 생생하고 구체적인 팁을 작성해 주세요.
            3. **포맷**: 
               - [Caption] 결과만 출력.
               - 10줄 이상의 충분한 길이와 정성스러운 내용.
               - 낚시 커뮤니티에서 실제로 쓰이는 자연스러운 표현(물때, 포인트, 손맛, 채비, 짬낚 등) 활용.
            4. **해시태그**: 낚시 매니아들이 소통할 때 쓰는 키워드 위주로 20개 이상 포함.
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('AI 생성 오류:', error);
            return "오늘도 대물 낚으러 떠나볼까요? 🎣 #낚시 #바다낚시 #대물기원 #낚시스타그램 #손맛";
        }
    }
}

module.exports = FishingAI;
