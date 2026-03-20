const axios = require('axios');

class InstagramPublisher {
    constructor(accessToken, igUserId) {
        this.accessToken = accessToken;
        this.igUserId = igUserId;
        this.baseUrl = "https://graph.facebook.com/v20.0";
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
            console.error('Error publishing to Instagram:', error.response?.data || error.message);
            throw error;
        }
    }
}

module.exports = InstagramPublisher;
