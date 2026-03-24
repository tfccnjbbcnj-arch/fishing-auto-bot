const axios = require('axios');

class InstagramPublisher {
    constructor(accessToken, igUserId) {
        this.accessToken = accessToken;
        this.igUserId = igUserId;
        this.baseUrl = `https://graph.facebook.com/v20.0`;
    }

    async publishPost(imageUrl, caption) {
        try {
            const containerResponse = await axios.post(`${this.baseUrl}/${this.igUserId}/media`, {
                image_url: imageUrl,
                caption: caption,
                access_token: this.accessToken
            });
            
            const creationId = containerResponse.data.id;
            console.log('미디어 컨테이너 생성 완료 (ID:', creationId + '). 10초간 대기합니다...');

            await new Promise(resolve => setTimeout(resolve, 10000));

            const publishResponse = await axios.post(`${this.baseUrl}/${this.igUserId}/media_publish`, {
                creation_id: creationId,
                access_token: this.accessToken
            });

            return publishResponse.data;
        } catch (error) {
            const errorMsg = error.response?.data?.error?.message || error.message;
            const errorCode = error.response?.data?.error?.code || '우회 오류';
            console.error(`❌ 인스타그램 포스팅 실패: [코드 ${errorCode}] ${errorMsg}`);
            
            if (error.response?.data) {
                console.error('상세 에러 객체:', JSON.stringify(error.response.data, null, 2));
            }
            throw new Error(`Instagram API 오류: ${errorMsg}`);
        }
    }
}

module.exports = InstagramPublisher;
