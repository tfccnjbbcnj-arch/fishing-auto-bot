const axios = require('axios');
const cheerio = require('cheerio');

class FishingScraper {
    async fetchLatestFishingNews() {
        try {
            const url = `https://search.naver.com/search.naver?where=news&query=%EB%82%9A%EC%8B%9C&sm=tab_pge&sort=1`;
            const { data } = await axios.get(url);
            const $ = cheerio.load(data);
            
            const newsItems = [];
            $('.news_tit').each((i, el) => {
                if (i < 5) { // 상위 5개 추출
                    newsItems.push({
                        title: $(el).text(),
                        link: $(el).attr('href')
                    });
                }
            });

            // 스미싱, 보이스피싱 등 낚시와 상관없는 뉴스 제거
            const filteredNews = newsItems.filter(item => {
                const badKeywords = ['스미싱', '보이스피싱', '가공', '주의', '사기'];
                return !badKeywords.some(word => item.title.includes(word));
            });

            return filteredNews;
        } catch (error) {
            console.error('Error fetching news:', error.message);
            return [];
        }
    }

    async fetchSeaWeather() {
        return {
            location: "전국 주요 낚시 포인트",
            status: "보통",
            tide: "사리 전후",
            temp: "15.2도"
        };
    }

    async getAllData() {
        const news = await this.fetchLatestFishingNews();
        const weather = await this.fetchSeaWeather();
        return { news, weather };
    }
}

module.exports = FishingScraper;
