import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import methodOverride from 'method-override';
import axios from 'axios';
import cookieParser from 'cookie-parser';

import path from 'path';
import fs from 'fs';

import { mySQLPool } from './modules/database';
import { createToken, createSignature } from './modules/jwt';

/*
  Types
*/
import { Market, Ticker, Payload } from './index.d';
import { UserSQLTable, BoardSQLTable, CommentSQLTable, CoinSQLTable } from './modules/database';

// Express
const app = express();
app.set('port', 8080);

// dotenv
dotenv.config();



/*
  Functions
*/

/** 
 * 토큰 검증 함수 
 * @param {token} JWT 토큰
 * @returns 위변조된 토큰일 시 false 반환
 * @returns 이상 없을 시 payload 반환
*/
const jwtExam: (token: string) => Payload | false = (token) => {
  // JWT Token : Header . Payload . Signature
  const splitToken = token.split('.');

  if (splitToken.length !== 3) return false
  const encHeader = splitToken[0];
  const encPayload = splitToken[1];
  const signature = splitToken[2];

  // Header와 Payload로 Signature 생성
  const tokenSignature = createSignature(encHeader, encPayload);

  // token Signature와 비교하여 검증
  if (signature != tokenSignature) return false;

  //payload를 디코딩하여 req.user에 넣음
  //JSON => 자바스크립트 객체화
  const payload: object = JSON.parse(Buffer.from(encPayload, 'base64').toString('utf-8'));

  return payload;
}

const alertMessage: (errorCode: string) => string = (errorCode) => {
  if (errorCode === '01') return '제목이나 내용을 입력하지 않았습니다';
  if (errorCode === '03') return '로그인 정보가 없습니다';
  if (errorCode === '12') return 'KRW이 충분하지 않습니다';
  if (errorCode === '13') return '판매 요청한 코인 수량이 보유한 수량보다 많습니다';
  console.log(`Error Occured! - Code(${errorCode})`);
  if (errorCode === '02') return '유저 검증에 문제가 있습니다';
  if (errorCode === '04') return '존재하지 않는 게시물입니다';
  if (errorCode === '05') return '게시물에 접근 권한이 없습니다';
  if (errorCode === '06') return 'DB 업데이트에 실패하였습니다';
  if (errorCode === '07') return '구글 코드를 받아오는데 실패했습니다';
  if (errorCode === '08') return '구글 토큰을 받아오는데 실패했습니다';
  if (errorCode === '09') return '구글 사용자 정보를 받아오는데 실패했습니다';
  if (errorCode === '10') return 'JWT 토큰 생성에 실패했습니다';
  if (errorCode === '11') return '요청한 마켓과 일치하는 ticker 데이터를 찾을 수 없습니다';
  return '알 수 없는 오류입니다';
}

const gMarket: Market[] = [];
let gTicker: Ticker[] = [];
// 코인 ticker 데이터 request 함수
const getTicker: () => void = async () => {
  try {
    // 마켓 정보를 불러옴
    const res1 = await axios.request<Market[]>({
      method: 'get',
      url: "https://api.upbit.com/v1/market/all?isDetails=false",
      headers: {
        accept: "application/json"
      }
    });

    // 전체 마켓 이름을 string
    let krwMrkStr: string = '';
    res1.data.forEach(elm => {
      if (elm.market.includes('KRW')) {
        gMarket.push(elm)
        krwMrkStr += krwMrkStr ? ', ' + elm.market : elm.market;
      }
    });

    setInterval(async () => {
      const res2 = await axios.request({
        method: 'get',
        url: "https://api.upbit.com/v1/ticker?markets=" + krwMrkStr,
        headers: {
          accept: "application/json"
        }
      });
      gTicker = res2.data;
    }, 1000);

  } catch (error) {
    console.log(error)
  }
}

getTicker();


/*
  미들웨어
*/
//body-parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
//method override
app.use(methodOverride('_method'));
//cors
app.use(cors());
//cookie-parser
app.use(cookieParser(process.env.COOKIE_SECRET));

//static file
app.use(express.static('public'));



app.listen(app.get('port'), () => {
  console.log(`server is running on ${app.get('port')}`);
});


// 토큰 검증 미들웨어
app.use((req, res, next) => {
  const { accessToken }: { accessToken: string | undefined } = req.cookies;
  if (!accessToken) {
    req.user = {
      id: 'anonymous'
    }
    return next();
  }

  try {
    const payload = jwtExam(accessToken);
    // 위변조된 토큰
    if (!payload) throw new Error('01');

    const payloadSerial = 'serial' in payload ? payload.serial : '';
    const payloadUserID = 'userid' in payload ? payload.userid : '';

    // 페이로드 정보를 읽어오는데 실패
    if (!payloadSerial || !payloadUserID) throw new Error('02');

    req.user = {
      serial: payloadSerial,
      id: payloadUserID,
    }
    next();
  } catch (error) {

    if (error instanceof Error) {
      if (error.message === '01') console.log('위변조된 토큰');
      if (error.message === '02') console.log('페이로드 정보를 읽어오는데 실패');
    } else {
      console.log(String(error));
    }

    req.user = {
      id: 'anonymous'
    }
    next();
  }
});


/*
  Routers
*/
// 유저 데이터 관련 라우터
app.use('/', require(path.join(__dirname, './routes/acount')));

// // 메인 blog 관련 라우터
// app.use('/', require(path.join(__dirname, './routes/blog')));

// // 코인 모의투자 라우터
// app.use('/', require(path.join(__dirname, './routes/coin')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
})

app.get('/coin/data', async (req, res) => {
  const resData = {
    market: gMarket,
    ticker: gTicker
  }
  res.send(resData);
});



app.get('/domain', (req, res) => {
  res.send(process.env.DOMAIN);
})


// 코인 원화 충전 api
app.post('/user/charge', async (req, res) => {
  const mySQL = await mySQLPool.getConnection();

  try {
    const { serial: userSerial, id: userID } = req.user;
    // 유저 검증 미들웨어 문제
    if (!req.user || !userID) throw new Error('02');
    // 로그인하지 않음
    if (!userSerial || userID === 'anonymous') throw new Error('03');

    const [resSQL] = await mySQL.query(
      `UPDATE user
      SET money=money+1000000, charge=charge+1
      WHERE id='${userID}'`
    );
    await mySQL.commit();

    if ('affectedRows' in resSQL && resSQL.affectedRows) {
      res.send({
        result: true,
        error: false,
      });
    } else throw new Error('06');

  } catch (error) {
    await mySQL.rollback();

    let errorMessage = '알 수 없는 오류입니다';
    if (error instanceof Error) {
      if (error.message === '01') errorMessage = '토큰 검증에 오류가 있습니다';
      if (error.message === '02') errorMessage = '로그인 정보가 없습니다';
      if (error.message === '06') errorMessage = 'DB 수정에 실패하였습니다';
    }
    else errorMessage = String(error);

    res.send({
      result: false,
      error: errorMessage,
    })
  } finally {
    mySQL.release();
  }
});

// 게시판 게시글 리스트 api
app.get("/board/data", async (req, res) => {
  const mySQL = await mySQLPool.getConnection();

  try {
    await mySQL.beginTransaction();
    const [resSQL] = await mySQL.query<BoardSQLTable[]>(`SELECT *
    FROM board
    ORDER BY board_serial DESC
    `);

    res.send({
      result: {
        sqlData: resSQL,
        userData: req.user,
      },
      error: false,
    });
  } catch (error) {
    await mySQL.rollback();
    console.error('게시글 List에서 에러발생');
    console.error(error);
  } finally {
    mySQL.release();
  }
});

// 게시글 생성 라우터
app.post("/board/post", async (req, res) => {
  const mySQL = await mySQLPool.getConnection();

  try {
    const { title: reqPostTitle, content: reqPostContent } = req.body;
    // body 데이터가 정상적으로 들어오지 않거나 값이 없음
    if (typeof reqPostTitle !== 'string' || reqPostTitle === '') throw new Error('01');
    if (typeof reqPostContent !== 'string' || reqPostContent === '') throw new Error('01');

    const { serial: userSerial, id: userID } = req.user;
    // 유저 검증 미들웨어 문제
    if (!req.user || !userID) throw new Error('02');
    // 로그인하지 않음
    if (!userSerial || userID === 'anonymous') throw new Error('03');

    await mySQL.beginTransaction();

    const [result] = await mySQL.query(`INSERT INTO board(user_serial, user_id, title, content, date)
    VALUES(${userSerial}, '${userID}', '${reqPostTitle}', '${reqPostContent}', NOW())`);

    await mySQL.commit();

    // DB 추가에 실패함
    if (!('affectedRows' in result) || !result.affectedRows) throw new Error('06');

    res.send({
      result: true,
      error: false
    });

  } catch (error) {
    await mySQL.rollback();

    let errorMessage = '알 수 없는 오류입니다';
    if (error instanceof Error) {
      errorMessage = alertMessage(error.message);
    } else {
      errorMessage = String(error);
    }

    res.send({
      result: false,
      error: errorMessage
    });
  } finally {
    mySQL.release();
  }

});

// 게시글 수정 라우터
app.put("/board/put/:serial", async (req, res) => {
  const mySQL = await mySQLPool.getConnection();

  const { serial: reqPostSerial } = req.params;

  try {
    const { title: putTitle, content: putContent } = req.body;
    // body 데이터가 정상적으로 들어오지 않음
    if (typeof putTitle !== 'string' || typeof putContent !== 'string') throw new Error('01');

    const { serial: userSerial, id: userID } = req.user;
    // 유저 검증 미들웨어 문제
    if (!req.user || !userID) throw new Error('02');
    // 로그인하지 않음
    if (!userSerial || userID === 'anonymous') throw new Error('03');

    await mySQL.beginTransaction();

    // 게시글 작성자와 로그인한 유저가 동일한지 확인
    const [resSQL1] = await mySQL.query<BoardSQLTable[]>(`SELECT user_serial
    FROM board
    WHERE board_serial=${reqPostSerial}`);

    // 존재하지 않는 게시물
    if (!resSQL1[0]) throw new Error('04');

    const { user_serial } = resSQL1[0];
    // 게시물 작성자와 게시물 수정 요청자가 일치하지 않음
    if (userSerial !== user_serial) throw new Error('05');

    // 게시물 수정
    const [resSQL2] = await mySQL.query(`UPDATE board
    SET title='${putTitle}', content='${putContent}'
    WHERE board_serial='${reqPostSerial}'`);

    await mySQL.commit();

    if ('affectedRows' in resSQL2 && resSQL2.affectedRows) {
      res.send({
        result: true,
        error: false
      });
    }
    else {
      throw new Error('06');
    }

  } catch (err) {
    await mySQL.rollback();
    let errMessage = '알 수 없는 오류입니다';

    if (err instanceof Error) {
      errMessage = alertMessage(err.message);
    } else {
      errMessage = String(err);
    }

    res.send({
      result: false,
      error: errMessage
    });
  } finally {
    mySQL.release();
  }

});

// 게시글 상세 페이지
app.get('/board/:serial', async (req, res) => {
  const mySQL = await mySQLPool.getConnection();

  const { serial: reqPostSerial } = req.params;

  try {
    const { serial: userSerial, id: userID } = req.user;
    // 유저 검증 미들웨어 문제
    if (!req.user || !userID) throw new Error('02');

    await mySQL.beginTransaction();

    const [resSQL1] = await mySQL.query<BoardSQLTable[]>(`SELECT *
    FROM board 
    WHERE board_serial=${reqPostSerial}`);

    const [resSQL2] = await mySQL.query<CommentSQLTable[]>(`SELECT * 
    FROM comment 
    WHERE board_serial=${reqPostSerial}`);

    // 게시물이 존재하지 않음
    if (!resSQL1[0]) throw new Error('04');

    res.send({
      result: {
        boardData: resSQL1[0],
        commentData: resSQL2,
        userData: req.user,
      },
      error: false,
    });
  } catch (error) {
    let errorMessage = '알 수 없는 오류입니다';
    if (error instanceof Error) {
      errorMessage = alertMessage(error.message);
    } else {
      errorMessage = String(error);
    }

    res.send({
      result: false,
      error: errorMessage
    });
  } finally {
    mySQL.release();
  }
});



// board delete
app.delete('/board/delete/:serial', async (req, res) => {
  const mySQL = await mySQLPool.getConnection();

  const { serial: reqPostSerial } = req.params;

  try {
    const { serial: userSerial, id: userID } = req.user;
    // 유저 검증 미들웨어 문제
    if (!req.user || !userID) throw new Error('02');
    // 로그인하지 않음
    if (!userSerial || userID === 'anonymous') throw new Error('03');

    await mySQL.beginTransaction();

    const [resSQL1] = await mySQL.query<BoardSQLTable[]>(`SELECT *
    FROM board
    WHERE board_serial=${reqPostSerial}`);

    // 게시물이 존재하지 않음
    if (!resSQL1[0]) throw new Error('04');
    const { user_serial } = resSQL1[0];

    // 게시물 작성자와 로그인한 유저가 불일치
    if (userSerial !== user_serial && userID !== 'admin') throw new Error('05');

    const [resSQL2] = await mySQL.query(`DELETE FROM board
    WHERE board_serial='${reqPostSerial}';`);

    await mySQL.commit();

    if ('affectedRows' in resSQL2 && resSQL2.affectedRows) {
      res.send({
        result: true,
        error: false
      });
    }
    else {
      // DB 업데이트 실패
      throw new Error('06');
    }

  } catch (error) {
    await mySQL.rollback();
    let errorMessage = '알 수 없는 오류입니다';
    if (error instanceof Error) {
      errorMessage = alertMessage(error.message);
    } else {
      errorMessage = String(error);
    }

    res.send({
      result: false,
      error: errorMessage
    });
  } finally {
    mySQL.release();
  }
});

// 댓글 추가 api
app.post('/comment/add', async (req, res) => {
  const mySQL = await mySQLPool.getConnection();

  try {
    const { content: reqContent } = req.body;
    const reqSerial = Number(req.body.serial);
    const reqCommentType = Number(req.body.reply);

    // body 데이터의 타입이 다르거나 댓글 내용이 없음
    if (isNaN(reqSerial)) throw new Error('01');
    if (typeof reqContent !== 'string' || reqContent === '') throw new Error('01');
    if (isNaN(reqCommentType)) throw new Error('01');

    const { serial: userSerial, id: userID } = req.user;
    // 유저 검증 미들웨어 문제
    if (!req.user || !userID) throw new Error('02');
    // 로그인하지 않음
    if (!userSerial || userID === 'anonymous') throw new Error('03');

    await mySQL.beginTransaction();

    const [resSQL] = await mySQL.query(
      `INSERT INTO comment(user_serial, user_id, board_serial, content, date, reply)
      VALUES(${req.user.serial}, '${req.user.id}', ${reqSerial}, '${reqContent}', NOW(), ${reqCommentType})`
    );

    await mySQL.commit();

    // DB 업데이트 실패
    if (!('affectedRows' in resSQL) || !resSQL.affectedRows) throw new Error('06');

    res.send({
      result: {
        sqlData: true,
        userData: req.user
      },
      error: false
    });

  } catch (error) {
    let errorMessage = '알 수 없는 오류입니다';
    if (error instanceof Error) {
      errorMessage = alertMessage(error.message);
    } else {
      errorMessage = String(error);
    }

    res.send({
      result: false,
      error: errorMessage
    });

  } finally {
    mySQL.release();
  }
});

// 댓글 수정 api
app.put('/comment/put', async (req, res) => {
  const mySQL = await mySQLPool.getConnection();

  try {
    const { serial: commentSerial, content: commentTitle } = req.body;
    // body 데이터가 정상적으로 들어오지 않음
    if (typeof commentSerial !== 'string' || typeof commentTitle !== 'string') throw new Error('01');

    const { serial: userSerial, id: userID } = req.user;
    // 유저 검증 미들웨어 문제
    if (!req.user || !userID) throw new Error('02');
    // 로그인하지 않음
    if (!userSerial || userID === 'anonymous') throw new Error('03');

    await mySQL.beginTransaction();

    const [resSQL1] = await mySQL.query<CommentSQLTable[]>(
      `SELECT *
      From comment
      WHERE comment_serial=${commentSerial}`
    )

    // 댓글이 존재하지 않음
    if (!resSQL1[0]) throw new Error('04');
    const { user_serial } = resSQL1[0];

    // 댓글 작성자와 로그인한 유저가 불일치
    if (userSerial !== user_serial && userID !== 'admin') throw new Error('05');

    const [resSQL2] = await mySQL.query(
      `UPDATE comment
      SET content=${commentTitle}
      WHERE comment_serial=${commentSerial}`
    )

    await mySQL.commit();

    // DB 업데이트 실패
    if (!('affectedRows' in resSQL2) || !resSQL2.affectedRows) throw new Error('06');

    res.send({
      result: {
        sqlData: resSQL2,
        userData: req.user
      },
      error: false
    });

  } catch (error) {
    await mySQL.rollback();

    let errorMessage = '알 수 없는 오류입니다';
    if (error instanceof Error) {
      errorMessage = alertMessage(error.message);
    } else {
      errorMessage = String(error);
    }

    res.send({
      result: false,
      error: errorMessage
    });
  } finally {
    mySQL.release();
  }
})

// 구글 로그인 페이지로 리다이렉션 라우터
app.get('/login/google', (req, res) => {
  const { GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI } = process.env;

  const GOOGLE_OAUTH_URI: string = 'https://accounts.google.com/o/oauth2/v2/auth';
  const queryClientID = '?client_id=' + GOOGLE_CLIENT_ID;
  const queryRedirectURI = '&redirect_uri=' + GOOGLE_REDIRECT_URI;
  const queryResponseType: string = '&response_type=code';
  const queryScope: string = '&scope=email profile';

  res.redirect(GOOGLE_OAUTH_URI + queryClientID + queryRedirectURI + queryResponseType + queryScope);
})

// 사용자 정보 요청 api
// 쿼리스트링으로 구글코드를 받아 google api에 토큰을 요청 후 응답받은 토큰으로 사용자 정보 재요청
app.get('/google/redirect', async (req, res) => {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;

  const mySQL = await mySQLPool.getConnection();

  try {
    const { code } = req.query;
    // 구글코드 발급이 정상적으로 되지 않았을 경우
    if (typeof code !== 'string') throw new Error('07');

    const GOOGLE_TOKEN_URL: string = 'https://oauth2.googleapis.com/token';
    // 토큰 요청
    const res1 = await axios.post(GOOGLE_TOKEN_URL, {
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code: code,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    const token = res1.data.access_token;
    // 토큰 발급이 정상적으로 되지 않았을 경우
    if (typeof token !== 'string') throw new Error('08');

    // 사용자 정보 요청
    // Bearer에 대한 정보는 아래 URL에서 확인
    // https://velog.io/@cada/토근-기반-인증에서-bearer는-무엇일까
    interface GoogleUserInfo {
      id?: string,
      email?: string,
      verified_email?: boolean,
      name?: string,
      given_name?: string,
      family_name?: string,
      picture?: string,
      locale?: string
    }
    const GOOGLE_USERINFO_URL: string = 'https://www.googleapis.com/oauth2/v2/userinfo';
    const res2 = await axios.get<GoogleUserInfo>(GOOGLE_USERINFO_URL, {
      headers: {
        Authorization: 'Bearer' + token,
      },
    });

    // 사용자 정보를 불러오는데 실패
    if (!res2.data.id) throw new Error('09');
    const userID = 'google-' + res2.data.id;

    // 가입되어있는 id인지 검사
    const [resSQL1] = await mySQL.query<UserSQLTable[]>(`SELECT user_serial 
      FROM user
      WHERE id='${userID}'`
    );

    let user_serial;
    if (resSQL1[0]?.user_serial) {
      user_serial = resSQL1[0].user_serial
    } else {
      // 가입되어있지 않은 ID

      // DB에 회원정보 생성
      const [resSQL2] = await mySQL.query(`INSERT INTO user(id) 
        VALUES('${userID}')`
      );

      // DB에 회원정보 생성 실패
      if (!('affectedRows' in resSQL2) || !resSQL2.affectedRows) throw new Error('06');

      // 해당 아이디 정보
      const [resSQL3] = await mySQL.query<UserSQLTable[]>(`SELECT user_serial 
        FROM user
        WHERE id='${userID}'`
      );

      // DB에서 회원정보를 불러오는데 실패
      if (!resSQL3[0].user_serial) throw new Error('06');

      user_serial = resSQL3[0].user_serial;
    }
    await mySQL.commit();

    const payload = {
      serial: user_serial,
      userid: userID,
      exp: '추가예정'
    };

    // JWT 생성
    const jwtToken = createToken(payload);
    // JWT토큰생성 실패
    if (!jwtToken) throw new Error('10');

    // 생성한 토큰을 쿠키로 만들어서 브라우저에게 전달
    res.cookie('accessToken', jwtToken, {
      path: '/',
      httpOnly: true
    });

    res.redirect('http://localhost:3000/');
  } catch (error) {
    await mySQL.rollback();

    let errorMessage = '알 수 없는 오류입니다';
    if (error instanceof Error) {
      if (error.message = '06') errorMessage = 'DB 업데이트에 실패하였습니다';
      if (error.message = '07') errorMessage = '구글 코드를 받아오는데 실패했습니다';
      if (error.message = '08') errorMessage = '구글 토큰을 받아오는데 실패했습니다';
      if (error.message = '09') errorMessage = '구글 사용자 정보를 받아오는데 실패했습니다';
      if (error.message = '10') errorMessage = 'JWT 토큰 생성에 실패했습니다';
    } else {
      errorMessage = String(error);
    }
    res.send({
      result: false,
      error: errorMessage
    });
  } finally {
    mySQL.release();
  }

})

// 댓글 삭제 api
app.delete('/comment/delete/:serial', async (req, res) => {
  const mySQL = await mySQLPool.getConnection();

  try {
    // 올바르지않은 path
    if (!req.params.serial || isNaN(Number(req.params.serial))) throw new Error('01');
    const reqCommentSerial = Number(req.params.serial);

    const { serial: userSerial, id: userID } = req.user;
    // 유저 검증 미들웨어 문제
    if (!req.user || !userID) throw new Error('02');
    // 로그인하지 않음
    if (!userSerial || userID === 'anonymous') throw new Error('03');

    await mySQL.beginTransaction();

    const [resSQL1] = await mySQL.query<CommentSQLTable[]>(`SELECT *
      FROM comment
      WHERE comment_serial=${reqCommentSerial}`
    );

    // 댓글이 존재하지 않음
    if (!resSQL1[0]) throw new Error('04');

    // 댓글 작성 유저와 로그인한 유저가 동일하지 않음
    if (resSQL1[0].user_serial !== userSerial && userID !== 'admin') throw new Error('05');

    const [resSQL2] = await mySQL.query(`DELETE FROM comment 
      WHERE comment_serial=${reqCommentSerial}`
    );
    await mySQL.commit();

    // DB 업데이트 실패
    if (!('affectedRows' in resSQL2) || !resSQL2.affectedRows) throw new Error('06');

    res.send({
      result: true,
      error: false
    })

  } catch (error) {
    await mySQL.rollback();

    let errorMessage = '알 수 없는 오류입니다';
    if (error instanceof Error) {
      errorMessage = alertMessage(error.message);
      if (error.message = '01') errorMessage = '요청이 잘못되었습니다';
    } else {
      errorMessage = String(error);
    }

    res.send({
      result: false,
      error: errorMessage
    });
  } finally {
    mySQL.release();
  }
});

// 유저 인증 정보
app.get('/user/verify', (req, res) => {
  try {
    const { serial: userSerial, id: userID } = req.user;
    // 유저 검증 미들웨어 문제
    if (!req.user || !userID) throw new Error('02');

    res.send({
      result: {
        serial: userSerial,
        id: userID,
      },
      error: false
    })

  } catch (err) {
    let errMessage = '';
    if (err instanceof Error) {
      errMessage = alertMessage(err.message);
    } else {
      errMessage = String(err);
    }

    res.send({
      result: false,
      error: errMessage
    });
  }
});

// 유저 프로필 정보
app.get('/user/profile', async (req, res) => {
  const mySQL = await mySQLPool.getConnection();

  try {
    const { serial: userSerial, id: userID } = req.user;
    // 유저 검증 미들웨어 문제
    if (!req.user || !userID) throw new Error('02');
    // 로그인하지 않음
    if (!userSerial || userID === 'anonymous') throw new Error('03');

    await mySQL.beginTransaction();
    const [result] = await mySQL.query<UserSQLTable[]>(
      `SELECT id, money, charge
      FROM user
      WHERE id='${req.user.id}'`
    );

    // DB 읽기 오류
    if (!result[0]) throw new Error('04');

    res.send({
      result: result[0],
      error: false,
    });
  } catch (error) {
    await mySQL.rollback();

    let errorMessage = '알 수 없는 오류입니다'
    if (error instanceof Error) {
      errorMessage = alertMessage(error.message);
      if (errorMessage = '04') return 'DB에서 사용자 정보를 읽어오는데 실패했습니다';
    } else {
      errorMessage = String(error);
    }

    res.send({
      result: false,
      error: errorMessage
    })

  } finally {
    mySQL.release();
  }
});

// 유저 코인 정보
app.get('/user/coin', async (req, res) => {
  const mySQL = await mySQLPool.getConnection();

  try {
    const { serial: userSerial, id: userID } = req.user;
    // 유저 검증 미들웨어 문제
    if (!req.user || !userID) throw new Error('02');
    // 로그인하지 않음
    if (!userSerial || userID === 'anonymous') throw new Error('03');

    const { market: reqMarket } = req.query;
    // 쿼리값이 없음
    if (!reqMarket) throw new Error('01')

    await mySQL.beginTransaction();

    // 요청한 마켓의 유저 코인정보
    const [resSQL1] = await mySQL.query<CoinSQLTable[]>(
      `SELECT price, amount
      FROM coin
      WHERE market='${reqMarket}' AND user_serial=${userSerial}`
    );

    // 요청한 유저의 현금정보
    const [resSQL2] = await mySQL.query<UserSQLTable[]>(
      `SELECT money
      FROM user
      WHERE user_serial=${req.user.serial}`
    );

    // DB 가져오기 실패
    if (!resSQL2[0]) throw new Error('04');

    res.send({
      result: {
        price: resSQL1[0]?.price || 0,
        amount: resSQL1[0]?.amount || 0,
        money: resSQL2[0].money
      },
      error: false,
    });
  } catch (error) {
    await mySQL.rollback();

    let errorMessage = '알 수 없는 오류입니다';
    if (error instanceof Error) {
      errorMessage = alertMessage(error.message);
    } else {
      errorMessage = String(error);
    }

    res.send({
      result: false,
      error: errorMessage
    })

  } finally {
    mySQL.release();
  }

});

// 코인 모의 거래 요청
app.post('/user/coin/trade', async (req, res) => {
  const mySQL = await mySQLPool.getConnection();

  try {
    const { request: reqType, market: reqMarketCode } = req.body;
    const reqAmount = Number(req.body.amount);

    // 요청값이 없거나 타입에 문제가 있음
    if (typeof reqType !== 'string' || typeof reqMarketCode !== 'string' || typeof reqAmount !== 'number') throw new Error('01');

    const { serial: userSerial, id: userID } = req.user;
    // 유저 검증 미들웨어 문제
    if (!req.user || !userID) throw new Error('02');
    // 로그인하지 않음
    if (!userSerial || userID === 'anonymous') throw new Error('03');

    let reqMarketTicker: Ticker | null = null;
    for (let i = 0; i < gTicker.length; i++) {
      if (gTicker[i].market === reqMarketCode) {
        reqMarketTicker = gTicker[i];
        break;
      }
    }

    // 요청한 마켓과 일치하는 ticker 데이터를 찾을 수 없음
    if (!reqMarketTicker) throw new Error('11')
    // 요청한 마켓의 현재가
    const { trade_price: reqMarketPrice } = reqMarketTicker;

    await mySQL.beginTransaction();

    // 유저의 요청한 코인 보유 수량 불러오기
    let [resSQL1] = await mySQL.query<CoinSQLTable[]>(`SELECT *
      FROM coin
      WHERE user_serial=${userSerial} AND market='${reqMarketCode}'`
    );


    // 추후 평단가 및 수량 계산을 위해 undefined일 경우 0대입
    const userOwnData = resSQL1[0] || {};
    userOwnData.price = userOwnData?.price || 0;
    userOwnData.amount = userOwnData?.amount || 0;

    if (reqType === 'buy') {
      // 유저의 현금 불러오기
      let [resSQL2] = await mySQL.query<UserSQLTable[]>(`SELECT *
        FROM user
        WHERE user_serial=${userSerial}`
      );

      // DB 데이터 불러오기 실패함
      if (!resSQL2[0]?.money) throw new Error('04');

      // KRW이 충분하지 않음
      if (resSQL2[0].money < reqAmount * reqMarketPrice) throw new Error('12');

      // 요청한 코인 수량 및 평단가 반영
      userOwnData.price = (userOwnData.amount * userOwnData.price + reqMarketPrice * reqAmount) / (userOwnData.amount + reqAmount);
      userOwnData.amount = userOwnData.amount + reqAmount;

      // 현금 차감
      const [resSQL3] = await mySQL.query(
        `UPDATE user
        SET money=money-${reqMarketPrice * reqAmount}
        WHERE user_serial='${userSerial}'`
      );

      // DB 업데이트 실패
      if (!('affectedRows' in resSQL3) || !resSQL3.affectedRows) throw new Error('06')

    } else if (req.body.request === 'sell') {
      // 보유한 코인 수량보다 요청한 수량이 많음
      if (userOwnData.amount < reqAmount) throw new Error('13');

      // 요청한 코인 수량 및 평단가 반영
      if (userOwnData.amount === reqAmount) userOwnData.price = 0;
      else userOwnData.price = (userOwnData.amount * userOwnData.price - reqMarketPrice * reqAmount) / (userOwnData.amount - reqAmount);

      userOwnData.amount = userOwnData.amount - reqAmount;

      // 현금 증액
      const [resSQL3] = await mySQL.query(`UPDATE user
        SET money=money+${reqMarketPrice * reqAmount}
        WHERE user_serial='${userSerial}'`
      );

      // DB 업데이트 실패
      if (!('affectedRows' in resSQL3) || !resSQL3.affectedRows) throw new Error('06')

    } else {
      // 요청타입에 문제가 있음 - buy/sell 중 하나가 아님
      throw new Error('');
    }

    // 보유 코인 수정
    if (userOwnData.coin_serial) {  // 해당 마켓에 가지고 있는 코인이 있다면
      const [resSQL4] = await mySQL.query(
        `UPDATE coin
        SET price=${userOwnData.price}, amount=${userOwnData.amount}
        WHERE user_serial='${userSerial}' AND market='${reqMarketCode}'`
      )

      // DB 업데이트 실패
      if (!('affectedRows' in resSQL4) || !resSQL4.affectedRows) throw new Error('06');
    } else {  // 해당 마켓에 가지고 있는 코인이 없다면
      const [resSQL4] = await mySQL.query(
        `INSERT INTO coin(user_serial, market, price, amount)
        VALUES(${userSerial}, '${reqMarketCode}', ${userOwnData.price}, ${userOwnData.amount})`
      );

      // DB 추가 실패
      if (!('affectedRows' in resSQL4) || !resSQL4.affectedRows) throw new Error('06');
    }

    // 매매 히스토리 기록
    const tradeType = reqType === 'buy' ? true : false;
    const [resSQL5] = await mySQL.query(`INSERT INTO trade(user_serial, trading, market, date)
      VALUES(${userSerial}, ${tradeType}, '${reqMarketCode}', NOW())`
    );

    // DB 추가 실패
    if (!('affectedRows' in resSQL5) || !resSQL5.affectedRows) throw new Error('06');

    await mySQL.commit();

    res.send({
      result: true,
      error: false,
    });

  } catch (error) {
    await mySQL.rollback();

    let errorMessage = '';
    if (error instanceof Error) {
      errorMessage = alertMessage(error.message);
    } else {
      errorMessage = String(error);
    }

    res.send({
      result: false,
      error: errorMessage
    })

  } finally {
    mySQL.release();
  }
});

//404 Middleware
app.use((req, res, next) => { // 404 처리 부분
  console.log('404');
  res.status(404).send('일치하는 주소가 없습니다!');
});

//Error Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => { // 에러 처리 부분
  console.error(err.stack); // 에러 메시지 표시
  res.status(500).send('서버 에러!'); // 500 상태 표시 후 에러 메시지 전송
});