# Node.js(Express)

개인 개발 Blog 및 코인 모의 거래 사이트 서버 입니다
## 🖇️ 준비 및 확인사항

### ⚠️ 주의사항
- 정상적인 구동을 위해서 .env 파일이 필요합니다

## 📄 세부 작업내역
#### 23.05.29
- front-end : 자기소개 페이지
- front-end : html/css 꾸미기
- front-end : 회원가입 시 정규식사용하여 특정 문자 사용 불가 처리 구현
- back-end : 회원가입 시 정규식사용하여 특정 문자 사용 불가 처리 구현 - SQL Injection 방지

#### 23.05.31
- front-end : 최근 거래 내역 표시 추가
- back-end : 최근 거래 내역 표시 추가 - api 수정
- front-end : 댓글/대댓글 버그 수정
- back-end : 대댓글이 있는 댓글은 삭제되지 않는 기능 추가 - api 수정
- front-end : 대댓글이 있는 댓글은 삭제되지 않는 기능 추가 - 컴포넌트 수정
- back-end : 댓글 및 대댓글 수정 기능 - api 수정
- front-end : 댓글 및 대댓글 수정 기능 - 컴포넌트 수정
- front-end : 게시판 메인 화면 댓글 수 표기
- back-end : 게시판 메인 화면 댓글 수 표기 - api SQL 구문 추가

## 💬 To Do List

### 수정 및 추가해야 할 작업 목록
- front-end : 코인 메인 화면 정렬 기능
- front-end : 마이페이지 기능 수정
- front-end : html/css 꾸미기
- back-end : 라우터 분리 및 js 파일 정리
- back-end : 게시판 조회수 기능 추가
- back-end : '삭제된 댓글입니다'로 변한 댓글의 대댓글이 없으면 삭제
- 공통 : 코드 리팩토링

### 레포지토리 외적 할 일


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






