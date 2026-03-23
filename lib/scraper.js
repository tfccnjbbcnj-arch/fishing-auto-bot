const axios = require('axios');
const cheerio = require('cheerio');

/**
 * 낚시 관련 최신 뉴스 및 기상 정보를 수집하는 모듈
 */
class FishingScraper {
    /**
     * 네이버 뉴스에서 '낚시' 키워드로 최신 이슈 검색
     */
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
            // 더 넓은 범위의 셀렉터로 시도 (뉴스 제목)
            // 다양한 뉴스 제목 선택자 시도
            $('.news_tit, .news_area a.news_tit, a.news_tit, .news_info .info.press').each((i, el) => {
                const title = $(el).text().trim();
                const link = $(el).attr('href');
                if (title && link && i < 10) {
                    newsItems.push({ title, link });
                }
            });

            if (newsItems.length === 0) {
                console.log('기본 셀렉터 실패, 대체 셀렉터 시도 중...');
                $('a').each((i, el) => {
                    const text = $(el).text();
                    if (text.includes('낚시') && i < 3) {
                        newsItems.push({ title: text.trim(), link: $(el).attr('href') });
                    }
                });
            }

            // 필터링: 스미싱, 사기, 보이스피싱 등 낚시와 상관없는 키워드 제외
            const filteredNews = newsItems.filter(item => {
                const badKeywords = ['스미싱', '보이스피싱', '가짜', '사기', '클릭', '주의'];
                return !badKeywords.some(word => item.title.includes(word));
            });

            return filteredNews;
        } catch (error) {
            console.error('Error fetching news:', error.message);
            return [];
        }
    }

    /**
     * 바다 기상/물때 정보 수집 (공공데이터 API 연동 전 가이드용)
     */
    async fetchSeaWeather() {
        // 실제 운영 시에는 공공데이터포털의 기상청/국립해양조사원 API를 연동해야 합니다.
        // 여기서는 구조를 위해 샘플 데이터를 반환합니다.
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
