# 개인 연습 프로젝트입니다.
- Next.js 를 학습할때 서버로 사용하고자 만든 서버 레포지토리 입니다.

# 왜 Next.js에 API 폴더로 서버를 대체하지 않는가?
- 지금 처럼 서버 / 프론트를 나눈 방식을 가장 많이 사용하기도 했고, 개인적으로 가장 편한 방식이라 판단되어 서버를 Express로 분리

# 프로젝트 실행
1. npm install
2. .env를 생성 다음의 데이터를 기입
DB_PRODUCTION_USERNAME = 
DB_PRODUCTION_HOST = 
DB_PRODUCTION_PORT = 
DB_PRODUCTION_DATABASE = 
DB_PRODUCTION_PASSWORD = 
COOKIE_SECRET = 
ADMINAUDIT = 
PORT = 
3. Multer 사용을 위한 디렉터리 생성 -> public/images
4. npm run start

# 구조
```
├── DB : DB 와 연동 관련된 코드인 DB.js 가 있습니다.
│   ├── DB.js : DB와 연동하는 부분
├── middleware : 여러 미들웨어를 작성한 부분입니다.
│   ├── multer.js : multer 와 연관된 미들웨어 입니다.
│   ├── jwt.js :  JWT 인증과 연관된 미들웨어 입니다.
│   ├── auditjwt.js :  특정권한의 JWT 인증과 연관된 미들웨어 입니다.
├── Router : API를 보관하는 폴더입니다.
│   ├── User.js :  회원가입 등 회원과 연관된 부분입니다
│   ├── LoginLog.js :  로그인 성공 시 해당 사용자의 IP 등 을 기록하는 부분입니다.
server.js : 서버를 가동하기 위한 파일입니다.
```