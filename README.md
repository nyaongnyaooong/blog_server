# Node.js(Express)

개인 개발 Blog 및 코인 모의 거래 사이트 서버 입니다
## 🖇️ 준비 및 확인사항

### ⚠️ 주의사항
- 정상적인 구동을 위해서 .env 파일이 필요합니다

## 📄 업데이트 세부 Comment
### 23.05.05
- 코인 세부 trade form 작성 (html & css)
- 유저 해당 코인 소유 정보 요청 api 초안 작성 (/user/coin)
- JWT payload에 user_serial 정보 추가 및 해당 작업에 따른 JWT 검증 미들웨어 코드 수정

## 💬 To Do List

### 수정 예정 목록
- 코인 모의 구매 판매 구현
- 게시판 페이지 react-router-dom 제거

### 레포지토리 외적 할 일
- 안드로이드 db 사용 => db 구축 성공 (23.05.01)
- 블로그에 해당 내용 정리 및 포스팅 할 것

## ⌨️ 명령어

### Install

```bash
  npm i
```

### BackEnd Server Start

```bash
  npm run dev
```

### FrontEnd Client Start

```bash
  cd react-start
  npm start
```


## 🏷️ ERD
![blog (3)](https://user-images.githubusercontent.com/68260365/235066087-b1c64561-994c-48b9-8e6f-67cd60f4c24e.png)






