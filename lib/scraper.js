const axios = require('axios');
const cheerio = require('cheerio');

class FishingScraper {
    async fetchLatestFishingNews() {
        try {
            const url = "https://search.naver.com/search.naver?where=news&query=%EB%82%9A%EC%8B%9C&sort=1";
            const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const $ = cheerio.load(data);
            const newsItems = [];
            $('.news_tit, .news_area a.news_tit').each((i, el) => {
                if (i < 3) newsItems.push({ title: $(el).text().trim(), link: $(el).attr('href') });
            });
            return newsItems;
        } catch (error) { return []; }
    }
    async fetchSeaWeather() { return { location: "전국", status: "보통", tide: "사리", temp: "15도" }; }
    async getAllData() { 
        const news = await this.fetchLatestFishingNews(); 
        const weather = await this.fetchSeaWeather(); 
        return { news, weather }; 
    }
}
module.exports = FishingScraper;
