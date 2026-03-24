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
            
            const styles = [
                "엄청나게 들뜨고 신난 실물파 조사", 
                "연륜이 느껴지는 묵직한 낚시 고수", 
                "MZ세대 인플루언서 느낌의 트렌디한 낚시꾼", 
                "유머러스하고 재치있는 낚시 개그맨", 
                "새벽 바다의 감성을 담은 낭만 낚시꾼",
                "이론과 실무를 겸비한 낚시 박사",
                "초보자들을 자상하게 이끌어주는 낚시 과외 선생님"
            ];
            const randomStyle = styles[Math.floor(Math.random() * styles.length)];
            
            const prompt = `
            당신은 온라인에서 가장 핫한 '낚시 전문 인플루언서'입니다. 
            아래 정보를 바탕으로 인스타그램 게시물을 작성해 주세요:
            
            [수집 정보]
            ${JSON.stringify(data, null, 2)}

            [작성 가이드]
            1. 말투 컨셉: '${randomStyle}' 스타일로 작성. (상황에 어울리는 이모지 많이 사용!)
            2. 주요 핵심: 정보만 전달하는 게 아니라, 실제 겪은 일처럼 생생하게 설명하고 낚시꾼들만 알 수 있는 '손맛', '물때', '짬낚' 같은 표현을 섞어줘.
            3. 뉴스 정보가 있다면 그 내용을 자연스럽게 언급하고, 없다면 '${data.randomTopic}' 주제로 실제 낚시 다녀온 후기처럼 써줘.
            4. 해시태그는 낚시꾼들이 소통할 때 자주 쓰는 것들 위주로 20개 이상.
            5. [Caption] 결과만 짧게 말고, 정성 가득하게 10줄 이상 출력.
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
