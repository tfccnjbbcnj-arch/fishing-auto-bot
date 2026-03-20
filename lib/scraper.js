const axios = require('axios');
const cheerio = require('cheerio');

class FishingScraper {
    async fetchLatestFishingNews() {
        try {
            const url = "https://search.naver.com/search.naver?where=news&query=%EB%82%9A%EC%8B%9C&sm=tab_pge&sort=1";
            const { data } = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            const $ = cheerio.load(data);
            
            const newsItems = [];
            $('.news_tit').each((i, el) => {
                if (i < 3) {
                    newsItems.push({
                        title: $(el).text(),
                        link: $(el).attr('href')
                    });
                }
            });

            // 스미싱/사기뉴스 필터링
            return newsItems.filter(item => {
                const badKeywords = ['스미싱', '사기', '피싱', '주의', '가짜'];
                return !badKeywords.some(word => item.title.includes(word));
            });
        } catch (error) {
            console.error('Error fetching news:', error.message);
            return [];
        }
    }

    async fetchSeaWeather() {
        return { location: "전국", status: "보통", tide: "사리", temp: "15도" };
    }

    async getAllData() {
        const news = await this.fetchLatestFishingNews();
        const weather = await this.fetchSeaWeather();
        return { news, weather };
    }
}

module.exports = FishingScraper;
