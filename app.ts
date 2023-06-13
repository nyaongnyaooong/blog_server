import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import methodOverride from 'method-override';
import axios from 'axios';
import cookieParser from 'cookie-parser';
import http from 'http';
import https from 'https';
import path from 'path';
import fs from 'fs';

import { createToken, createSignature } from './modules/jwt';

/*
  Types
*/
import { Market, Ticker, Payload } from './index.d';
import { mySQLPool, UserSQLTable, BoardSQLTable, CommentSQLTable, CoinSQLTable, TradeSQLTable } from './modules/database';
import { ResultSetHeader } from 'mysql2';

// Express
const app = express();


// dotenv
dotenv.config();

const options = {
  key: fs.readFileSync('./key/nyaong.myddns.me-key.pem'),
  cert: fs.readFileSync('./key/nyaong.myddns.me-crt.pem')
};

app.set('httpPort', process.env.HTTP_PORT || 80);
app.set('httpsPort', process.env.HTTPS_PORT || 443);


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

/**
 * 에러 코드 => 에러 메세지 변환 함수
 * @param errorCode 
 * @returns errorMessage
 */
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

class CustomError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CustomError';
  }
}




/*
  미들웨어
*/

// https redirection
app.use((req, res, next) => {
  if (req.secure) next();
  else res.redirect("https://" + req.headers.host + req.url);
});

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
    if (!payload) throw new CustomError('01');

    const payloadSerial = 'serial' in payload ? payload.serial : '';
    const payloadUserID = 'userid' in payload ? payload.userid : '';

    // 페이로드 정보를 읽어오는데 실패
    if (!payloadSerial || !payloadUserID) throw new CustomError('02');

    req.user = {
      serial: payloadSerial,
      id: payloadUserID,
    }
    next();
  } catch (error) {

    if (error instanceof CustomError) {
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
// 사용자 정보 관련 라우터
app.use('/', require(path.join(__dirname, '/routes/acount')));

// 코인 모의투자 라우터
app.use('/', require(path.join(__dirname, '/routes/coin')));

// 자유게시판 관련 라우터
app.use('/', require(path.join(__dirname, '/routes/board')));





app.get('/domain', (req, res) => {
  // res.send(process.env.DOMAIN);
  res.sendFile(path.join(__dirname, '/public/index.html'));
})


app.get('/', (req, res) => {
  console.log(1);
  res.sendFile(path.join(__dirname, '/public/index.html'));
})



// 유저 인증 정보
app.get('/user/verify', (req, res) => {
  try {
    const { serial: userSerial, id: userID } = req.user;
    // 유저 검증 미들웨어 문제
    if (!req.user || !userID) throw new CustomError('유저 검증에 문제가 있습니다');

    res.send({
      result: {
        serial: userSerial,
        id: userID,
      },
      error: false
    })

  } catch (err) {
    let errMessage = '알 수 없는 오류입니다';
    if (err instanceof CustomError) {
      errMessage = err.message;
    } else {
      console.log(err);
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
    if (!req.user || !userID) throw new CustomError('유저 검증에 문제가 있습니다');
    // 로그인하지 않음
    if (!userSerial || userID === 'anonymous') throw new CustomError('로그인 정보가 없습니다');

    await mySQL.beginTransaction();
    const [result] = await mySQL.query<UserSQLTable[]>(
      `SELECT user_serial, id
      FROM user
      WHERE user_serial='${userSerial}'`
    );

    // DB 읽기 오류
    if (!result[0]) throw new CustomError('04');

    res.send({
      result: result[0],
      error: false,
    });
  } catch (err) {
    let errMessage = '알 수 없는 오류입니다';
    if (err instanceof CustomError) {
      errMessage = err.message;
    } else {
      console.log(err);
    }

    res.send({
      result: false,
      error: errMessage
    });
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

// app.listen(app.get('port'), () => {
//   console.log(`server is running on ${app.get('port')}`);
// });

// Create an HTTPS service identical to the HTTP service.
https.createServer(options, app).listen(app.get('httpsPort'), () => {
  console.log('server is running on ' + app.get('httpsPort'));
});

// Create an HTTP service.
http.createServer(app).listen(app.get('httpPort'), () => {
  console.log('server is running on ' + app.get('httpPort'));
});
