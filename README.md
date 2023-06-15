# 개인 프로젝트
코인 모의 거래 및 자유 게시판 입니다<br />
URL : https://nyaong.myddns.me/


---


## 목차
[주요기능](#코인-모의-거래-후-전체-자산-확인)
[기능 미리보기](#코인-모의-거래-후-전체-자산-확인)
[서버 구성도](#코인-모의-거래-후-전체-자산-확인)
[서버 구성도](#코인-모의-거래-후-전체-자산-확인)
[서버 구성도](#코인-모의-거래-후-전체-자산-확인)
<br />
<br />
<br />


---


## 🖇️ 주요기능

### 공통
- 회원 가입 및 로그인 (+구글 Oauth2 로그인)
- 패스워드 변경 및 회원 탈퇴

### 코인 모의 거래 사이트
- 코인 실시간 가격 확인
- 코인 모의 구매와 판매
- 코인 모의 거래 후 전체 자산 확인

### 자유 게시판
- 게시글 작성 / 읽기 / 수정 / 삭제 
- 댓글과 대댓글의 작성 / 읽기 / 수정 / 삭제


---


## 기능 설명 및 미리보기

### 서버 구성도
<!-- ![image](https://github.com/nyaongnyaooong/coin_trade/assets/68260365/eb9d63bc-21cb-4701-a2dd-7d75d59c7931) -->
<img src='https://github.com/nyaongnyaooong/coin_trade/assets/68260365/eb9d63bc-21cb-4701-a2dd-7d75d59c7931' style='width=300px' />


### ERD 설계도
<img src='https://user-images.githubusercontent.com/68260365/235066087-b1c64561-994c-48b9-8e6f-67cd60f4c24e.png' style='width=300px' />


### 회원 가입 및 로그인 (+구글 Oauth2 로그인)
- 구글 Oauth2로 로그인시 구글 ID로 자동 회원가입 및 로그인
- 정규식을 이용한 아이디 유효성 검사 / SQL injection 방지
- 아이디 비밀번호 일치여부 검사 및 결과 클라이언트에 전송하는 api구현


![login](https://github.com/nyaongnyaooong/coin_trade/assets/68260365/9b6f496c-bfc0-4d04-a73a-afb464f3dba2)


### 패스워드 변경 및 회원 탈퇴


![changePW](https://github.com/nyaongnyaooong/coin_trade/assets/68260365/4ce72754-2a27-408b-b56f-c662ffff3c9f)


### 코인 실시간 가격 확인
- 업비트 api로부터 실시간 코인 가격 정보를 불러와 클라이언트에 표시


![coinMain](https://github.com/nyaongnyaooong/coin_trade/assets/68260365/02d946d1-23bc-4cad-9256-2b0d01cbfc4c)


### 코인 모의 구매와 판매
- 특정 코인 구매/판매 요청시 요청에 따라 db수정


![coinTrade](https://github.com/nyaongnyaooong/coin_trade/assets/68260365/86710be7-1c0f-4a82-b7ab-df2b6fd66915)


### 코인 모의 거래 후 전체 자산 확인


![coinAsset](https://github.com/nyaongnyaooong/coin_trade/assets/68260365/317abbc0-a992-45ec-bac0-f5a3990cfbd1)


### 게시글 작성 / 읽기 / 수정 / 삭제 
- 해당 게시글의 작성자만 수정/삭제 권한 부여


![post](https://github.com/nyaongnyaooong/coin_trade/assets/68260365/6726320d-f2f9-4474-bd22-c7122c612d89)


### 댓글과 대댓글의 작성 / 읽기 / 수정 / 삭제
- 해당 댓글의 작성자만 수정/삭제 권한 부여
- 대댓글이 있는 댓글 삭제요청시 '삭제되었습니다'로 표기. 이후 해당 댓글의 대댓글 삭제시 함께 삭제


![comment](https://github.com/nyaongnyaooong/coin_trade/assets/68260365/293a1627-a8a5-410b-87d1-445dd835da87)


---


## 코드 설명

### 에러처리
기본적으로 라우터 내에서 요청을 처리할 때 try catch문을 이용하여 서버적인 에러발생은 에러객체를 생성하고, 클라이언트 측 문제(ex: 로그인시 비밀번호가 다름 등)의 경우에는 커스텀에러객체를 생성하도록 하였습니다. 일반적인 에러는 console을 이용하여 서버에 알리고, 커스텀에러는 클라이언트에 어떤종류의 에러가 발생했는지 알리도록 구현하였습니다.
```bash
  class CustomError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'CustomError';
    }
  }

  app.post('/login/post', async (req, res) => {
    try {
      
      ...로그인 처리 코드
      if (비밀번호가 틀림) throw new CustomError('비밀번호가 틀렸습니다');

    } catch(err) {
      if (err instanceof CustomError) {
        res.send(err.message);
      } else {
        console.log(err);
      }
    }
  }
```

### Oauth2를 이용한 구글 로그인
기본적으로 라우터 내에서 요청을 처리할 때 try catch문을 이용하여 서버적인 에러발생은 에러객체를 생성하고, 클라이언트 측 문제(ex: 로그인시 비밀번호가 다름 등)의 경우에는 커스텀에러객체를 생성하도록 하였습니다. 일반적인 에러는 console을 이용하여 서버에 알리고, 커스텀에러는 클라이언트에 어떤종류의 에러가 발생했는지 알리도록 구현하였습니다.
```bash
  class CustomError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'CustomError';
    }
  }

  app.post('/login/post', async (req, res) => {
    try {
      
      ...로그인 처리 코드
      if (비밀번호가 틀림) throw new CustomError('비밀번호가 틀렸습니다');

    } catch(err) {
      if (err instanceof CustomError) {
        res.send(err.message);
      } else {
        console.log(err);
      }
    }
  }
```