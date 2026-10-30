# 단어비 (word-rain)

영어 단어가 떨어지면 한글 뜻을 입력하는 타자 게임. 빌드 도구 없이 `dist/` 폴더의 정적 파일(HTML/CSS/JS)로 동작하고, GitHub(jcompany9/daneobi)에 올리면 Vercel이 배포함.

단어 데이터는 `dist/words/`에 있음: core.js(예전 단어 정리본) + e·m·h·i·a.js(단계별 추가분). 형식은 `addWords([['영어','뜻1|뜻2','단계 글자'], ...])`, 단계 글자 e초등·m중등·h고등·i중급·a고급. 같은 영어 단어는 한 파일에만 둘 것. 뜻은 한글만(띄어쓰기는 정답 비교 때 무시).

`api/scores.js`는 오늘의 순위를 저장하는 Vercel 서버 함수. Upstash Redis 환경 변수(KV_REST_API_URL/TOKEN 또는 UPSTASH_REDIS_REST_URL/TOKEN)가 없으면 503을 돌려주고, 게임은 기기 저장 순위로 동작함.

## 앱 (안드로이드·아이폰)
- `app/` 폴더: Capacitor 8 프로젝트. 게임 파일은 `../dist`를 그대로 씀 (appId `com.jcompany9.daneobi`, 이름 단어비). Vercel 배포와는 상관없음
- 앱에서만 켜지는 기능: `dist/note.js`(오답 노트·오답판), `dist/app.js`(뒤로 가기, 공유). `IS_APP`(game.js 맨 위)으로 구분하고, 웹에서는 아무것도 안 함
- 앱에서 순위 서버는 `https://daneobi.vercel.app/api/scores`를 부르고, `api/scores.js`가 앱 주소(https://localhost 등)를 허용함
- **빌드할 때 한글 경로 문제**: 프로젝트 경로의 "영어단어" 때문에 안드로이드 빌드가 실패함. PowerShell에서 `subst W: "C:\Users\graet\Documents\ChatGPT\영어단어\word-rain"` 로 연결한 뒤 `W:\app`에서 작업
- Java 21 필요: `export JAVA_HOME="$HOME/scoop/apps/temurin21-jdk/current"`
- 웹 파일을 바꾼 뒤: `cd /w/app && npx cap sync android` → `cd android && ./gradlew bundleRelease` (출시용 .aab) / `assembleDebug` (시험용 .apk). 결과 파일은 `app/release/`에 복사해 둠(커밋 안 함)
- 출시할 때마다 `app/android/app/build.gradle`의 versionCode(+1)와 versionName을 올릴 것
- **서명 키는 저장소 밖** `C:\Users\graet\daneobi-keys\` (저장소가 공개라서). 절대 커밋하지 말 것
- 스토어 등록 자료(설명 글, 스크린샷, 아이콘): `app/store/`

## 작업 규칙
- 사용자는 한국어로 소통함. 설명은 한국어로, 쉬운 말로.
- **업데이트할 때마다 [CHANGELOG.md](CHANGELOG.md) 맨 위에 항목을 추가**하고 같은 커밋에 포함할 것. 날짜와 시간, 한 줄 요약, 바뀐 내용, 커밋 번호.
- 이 폴더는 ChatGPT 쪽 작업 폴더에서 파일이 덮어씌워지기도 함. 작업 전에 `git status`로 내가 만들지 않은 변경이 있는지 확인하고, 있으면 덮어쓰지 말고 사용자에게 먼저 알릴 것.
- 미완료 작업 목록은 [TODO.md](TODO.md)에 있음.
