# 단어비 (word-rain)

영어 단어가 떨어지면 한글 뜻을 입력하는 타자 게임. 빌드 도구 없이 `dist/` 폴더의 정적 파일(HTML/CSS/JS)로 동작하고, GitHub(jcompany9/daneobi)에 올리면 Vercel이 배포함.

단어 데이터는 `dist/words/`에 있음: core.js(예전 단어 정리본) + e·m·h·i·a.js(단계별 추가분). 형식은 `addWords([['영어','뜻1|뜻2','단계 글자'], ...])`, 단계 글자 e초등·m중등·h고등·i중급·a고급. 같은 영어 단어는 한 파일에만 둘 것. 뜻은 한글만(띄어쓰기는 정답 비교 때 무시).

`api/scores.js`는 오늘의 순위를 저장하는 Vercel 서버 함수. Upstash Redis 환경 변수(KV_REST_API_URL/TOKEN 또는 UPSTASH_REDIS_REST_URL/TOKEN)가 없으면 503을 돌려주고, 게임은 기기 저장 순위로 동작함.

## 작업 규칙
- 사용자는 한국어로 소통함. 설명은 한국어로, 쉬운 말로.
- **업데이트할 때마다 [CHANGELOG.md](CHANGELOG.md) 맨 위에 항목을 추가**하고 같은 커밋에 포함할 것. 날짜와 시간, 한 줄 요약, 바뀐 내용, 커밋 번호.
- 이 폴더는 ChatGPT 쪽 작업 폴더에서 파일이 덮어씌워지기도 함. 작업 전에 `git status`로 내가 만들지 않은 변경이 있는지 확인하고, 있으면 덮어쓰지 말고 사용자에게 먼저 알릴 것.
- 미완료 작업 목록은 [TODO.md](TODO.md)에 있음.
