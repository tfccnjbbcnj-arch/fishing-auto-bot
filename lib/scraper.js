const axios = require('axios');
const cheerio = require('cheerio');

class FishingScraper {
    async fetchLatestFishingNews() {
        try {
            const keywords = ['낚시', '바다낚시', '민물낚시', '루어낚시', '낚시 대회', '낚시 포인트', '낚시 명소'];
            const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
            console.log(`검색 키워드: ${randomKeyword}`);

            const encodedKeyword = encodeURIComponent(randomKeyword);
            const url = `https://search.naver.com/search.naver?where=news&query=${encodedKeyword}&sm=tab_pge&sort=1`;
            const { data } = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            const $ = cheerio.load(data);
            
            const newsItems = [];
            $('.news_tit, .news_area a.news_tit, a.news_tit, .news_info .info.press').each((i, el) => {
                const title = $(el).text().trim();
                const link = $(el).attr('href');
                if (title && link && i < 10) {
                    newsItems.push({ title, link });
                }
            });

            if (newsItems.length === 0) {
                console.log('⚠️ 네이버 뉴스 원본 태그 발견 실패. 대체 셀렉터 시도 중...');
                $('a').each((i, el) => {
                    const text = $(el).text();
                    if ((text.includes('낚시') || text.includes('출조')) && i < 5) {
                        newsItems.push({ title: text.trim(), link: $(el).attr('href') });
                    }
                });
            }

            const filteredNews = newsItems.filter(item => {
                const badKeywords = ['스미싱', '보이스피싱', '가짜', '사기', '클릭', '주의'];
                return !badKeywords.some(word => item.title.includes(word));
            });

            if (filteredNews.length === 0) {
                console.log('ℹ️ 오늘 수집된 새로운 낚시 뉴스가 없습니다. (AI 주제 모드 가동)');
            } else {
                console.log(`✅ ${filteredNews.length}개의 관련 뉴스 링크를 확보했습니다.`);
            }

            return filteredNews;
        } catch (error) {
            console.error('❌ 뉴스 데이터 크롤링 중 오류:', error.message);
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
