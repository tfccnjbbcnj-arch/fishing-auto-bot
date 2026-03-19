# 낚시 이슈 자동화 봇 설치 및 설정 가이드

본 봇은 매일 최신 낚시 뉴스를 수집하여 Gemini AI로 요약한 뒤, 인스타그램에 자동으로 업로드합니다.

## 🛠 필수 준비물
1. **Google AI Studio API Key**: Gemini AI를 통해 콘텐츠를 생성하기 위해 필요합니다.
2. **Instagram Graph API 정보**:
   - Facebook Business Page와 연동된 Instagram Business 계정.
   - Meta for Developers에서 생성된 **App Access Token**.
   - **Instagram User ID**.

## 🚀 설정 방법 (GitHub Actions 사용 시)

1. 이 프로젝트 코드를 본인의 **GitHub Repository**에 업로드합니다.
2. Repository 설정의 **Settings > Secrets and variables > Actions** 메뉴로 이동합니다.
3. 다음 **Repository secrets**를 추가합니다:
   - `GEMINI_API_KEY`: Google AI Studio에서 발급받은 키.
   - `INSTAGRAM_ACCESS_TOKEN`: Meta API에서 발급받은 토큰.
   - `INSTAGRAM_USER_ID`: 본인의 인스타그램 비즈니스 계정 ID.
   - `DEFAULT_IMAGE_URL` (옵션): 포스팅에 사용할 기본 이미지 URL.

## ⏰ 실행 주기
`.github/workflows/daily_post.yml` 설정에 의해 **매일 오전 9시(KST)**에 자동으로 작동합니다.
GitHub Actions 메뉴에서 `Run workflow` 버튼을 눌러 즉시 테스트해볼 수도 있습니다.

## 📂 파일 구조
- `lib/scraper.js`: 낚시 뉴스 데이터 수집.
- `lib/ai.js`: Gemini AI를 이용한 캡션 생성.
- `lib/publisher.js`: Instagram Graph API 연동.
- `index.js`: 전체 흐름 제어.
