# 개인 프로젝트
코인 모의 거래 및 자유 게시판 입니다<br />
URL : https://nyaong.myddns.me/


---


## 🖇️ 목차
1. [주요기능](#주요기능)

1. [기능 설명 및 미리보기](#기능-설명-및-미리보기)

1. [코드 설명](#코드-설명)

1. [트러블슈팅](#트러블슈팅)


---


## 주요기능
<div align="right">

[위로 올라가기](#개인-프로젝트)

</div>

<!-- ### 공통
- [회원 가입 및 로그인 (+구글 Oauth2 로그인)](#회원-가입-및-로그인-(+구글-Oauth2-로그인))
- [패스워드 변경 및 회원 탈퇴](#패스워드-변경-및-회원-탈퇴)

### 코인 모의 거래 사이트
- [코인 실시간 가격 확인](#코인-실시간-가격-확인)
- [코인 모의 구매와 판매](#코인-모의-구매와-판매)
- [코인 모의 거래 후 전체 자산 확인](#코인-모의-거래-후-전체-자산-확인)

### 자유 게시판
- [게시글 작성 / 읽기 / 수정 / 삭제](#게시글-작성-/-읽기-/-수정-/-삭제)
- [댓글과 대댓글의 작성 / 읽기 / 수정 / 삭제](#댓글과-대댓글의-작성-/-읽기-/-수정-/-삭제) -->
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
<div align="right">

[위로 올라가기](#개인-프로젝트)

</div>

### 서버 구성도
<img src='https://github.com/nyaongnyaooong/coin_trade/assets/68260365/eb9d63bc-21cb-4701-a2dd-7d75d59c7931' width="600px" />


### ERD 설계도
<img src='https://github.com/nyaongnyaooong/coin_trade/assets/68260365/ca45c3b8-7e0a-484a-be90-23009547a48b' width="600px" />


### 회원 가입 및 로그인 (+구글 Oauth2 로그인)
- 구글 Oauth2로 로그인시 구글 ID로 자동 회원가입 및 로그인
- 정규식을 이용한 아이디 유효성 검사 / SQL injection 방지
- 아이디 비밀번호 일치여부 검사 및 결과 클라이언트에 전송하는 api구현


<img src='https://github.com/nyaongnyaooong/coin_trade/assets/68260365/9b6f496c-bfc0-4d04-a73a-afb464f3dba2' width="600px" />


### 패스워드 변경 및 회원 탈퇴


<img src='https://github.com/nyaongnyaooong/coin_trade/assets/68260365/4ce72754-2a27-408b-b56f-c662ffff3c9f' width="600px" />


### 코인 실시간 가격 확인
- 업비트 api로부터 실시간 코인 가격 정보를 불러와 클라이언트에 표시


<img src='https://github.com/nyaongnyaooong/coin_trade/assets/68260365/02d946d1-23bc-4cad-9256-2b0d01cbfc4c' width="600px" />


### 코인 모의 구매와 판매
- 특정 코인 구매/판매 요청시 요청에 따라 db수정


<img src='https://github.com/nyaongnyaooong/coin_trade/assets/68260365/86710be7-1c0f-4a82-b7ab-df2b6fd66915' width="600px" />


### 코인 모의 거래 후 전체 자산 확인


<img src='https://github.com/nyaongnyaooong/coin_trade/assets/68260365/317abbc0-a992-45ec-bac0-f5a3990cfbd1' width="600px" />


### 게시글 작성 / 읽기 / 수정 / 삭제 
- 해당 게시글의 작성자만 수정/삭제 권한 부여


<img src='https://github.com/nyaongnyaooong/coin_trade/assets/68260365/6726320d-f2f9-4474-bd22-c7122c612d89' width="600px" />


### 댓글과 대댓글의 작성 / 읽기 / 수정 / 삭제
- 해당 댓글의 작성자만 수정/삭제 권한 부여
- 대댓글이 있는 댓글 삭제요청시 '삭제되었습니다'로 표기. 이후 해당 댓글의 대댓글 삭제시 함께 삭제


<img src='https://github.com/nyaongnyaooong/coin_trade/assets/68260365/293a1627-a8a5-410b-87d1-445dd835da87' width="600px" />


---


## 코드 설명
<div align="right">

[위로 올라가기](#개인-프로젝트)

</div>

### JWT를 이용한 토큰 방식의 로그인
JWT 토큰을 쿠키로 발행하여 로그인을 구현했습니다. 토큰 탈취의 위험을 방지하기 위해 ip와 기기정보를 암호화하여 토큰에 함께 부여하고, 접속요청하는 클라이언트의 정보와 비교할 수 있도록하였습니다. 다음은 로그인 요청 시 토큰을 쿠키에 발급하는 코드 중 일부입니다.
```bash
  const agentSalt = crypto.randomBytes(64).toString('hex')

  // 페이로드
  const payload: Payload = {
    serial: user_serial,
    userid: id,
    adress: hashing(req.ip),
    agent: hashing(req.header('User-Agent') || '', agentSalt),
    salt: agentSalt
  };

  //JWT 생성
  const token = createToken(payload);

  // 토큰생성 실패
  if (!token) throw new Error('토큰 생성에 실패했습니다');

  // 생성한 토큰을 쿠키로 만들어서 브라우저에게 전달
  res.cookie('accessToken', token, {
    path: '/',
    httpOnly: true,
    maxAge: 3600000,
    secure: true,
    sameSite: 'strict',
  });
```

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


---


## 트러블슈팅
<div align="right">

[위로 올라가기](#개인-프로젝트)

</div>

- 타입스크립트 (23.05.22)
  - 현상 : 가능한 클라이언트의 비정상적인 요청에 대한 경우의 수를 모두 생각하여 에러처리를 작성해야합니다.
  - 해결 : 타입스크립트를 통해 정적타입을 적용하면서 미처 생각하지 못한 경우를 발견할 수 있었고, TS의 좀 더 직관적인 에러출력은 버그를 수정하는데 용이하였습니다.

- 에러처리 (23.05.25)
  - 현상 : 클라이언트가 잘못된 요청을 했을 경우 에러객체를 생성하고 해당 메세지를 클라이언트에 전송하는 코드를 작성하였는데 db 에러와같은 서버측 에러메세지도 넘어간다는 문제가 생겼습니다.
  - 해결 : CustomError를 정의하여 클라이언트의 잘못된 요청은 CustomError를 생성하여 일반 에러발생시엔 클라이언트로 전송하지 않도록 코드를 수정하였습니다.

- SQL injection (23.05.30)
  - 현상 : 클라이언트에서 로그인 요청시 요청한 데이터를 기반으로 db에 접근하게되는데 sql구문 형식으로 데이터를 보낼 경우 의도치않은 db접근이 이루어 질 수 있음을 확인했습니다.
  - 해결 : 클라이언트와 서버에서 이중으로 데이터의 유효성을 검증하여 불필요한 특수문자등의 구문이 들어오지 않도록 처리하였습니다.

- JWT (23.06.15)
  - 현상 : 클라이언트에서 로그인 요청시 요청한 데이터를 기반으로 db에 접근하게되는데 sql구문 형식으로 데이터를 보낼 경우 의도치않은 db접근이 이루어 질 수 있음을 확인했습니다.
  - 해결 : 클라이언트와 서버에서 이중으로 데이터의 유효성을 검증하여 불필요한 특수문자등의 구문이 들어오지 않도록 처리하였습니다.