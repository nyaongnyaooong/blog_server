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

import { createToken, createSignature, hashing } from './modules/jwt';

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
  const payload: Payload = JSON.parse(Buffer.from(encPayload, 'base64').toString('utf-8'));

  return payload;
}

/**
 * 에러 코드 => 에러 메세지 변환 함수
 * @param errorCode 
 * @returns errorMessage
 */

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

//static file
app.use(express.static('public'));
//body-parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
//method override
app.use(methodOverride('_method'));
//cors
app.use(cors());
//cookie-parser
app.use(cookieParser(process.env.COOKIE_SECRET));
//morgan
app.use(morgan('dev'));


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
    // 쿠키에서 페이로드 정보만 parsing하여 디코딩
    const payload = jwtExam(accessToken);

    // jwtExam함수는 위변조된 토큰일 경우 false를 반환합니다
    if (!payload) throw new Error('위변조된 토큰');
    const { serial: payloadSerial, userid: payloadUserID, adress: payloadAdress, agent: payloadAgent, salt: payloadAgentSalt } = payload;

    // 페이로드 정보를 읽어오는데 실패
    if (!payloadSerial || !payloadUserID || !payloadAdress || !payloadAgent) throw new Error('페이로드 정보를 읽어오는데 실패');

    // ip가 다르면
    if (payloadAdress !== hashing(req.ip)) {
      // 모바일(안드로이드 / iphone) 환경
      if (req.header('User-Agent')?.includes('iPhone') || req.header('User-Agent')?.includes('Android')) {
        // 접속 기기가 다르면
        if (payloadAgent !== (hashing(req.header('User-Agent') || '', payloadAgentSalt))) throw new CustomError('접속환경이 다름');
      } else throw new CustomError('접속환경이 다름');
    }

    req.user = {
      serial: payloadSerial,
      id: payloadUserID,
    }
    next();

  } catch (err) {
    let errMessage = '알 수 없는 오류로 로그아웃됩니다';

    res.cookie('accessToken', '', {
      path: '/',
      httpOnly: true,
      maxAge: 0
    });

    if (err instanceof CustomError) {
      if (err.message = '접속환경이 다름') errMessage = '접속환경이 달라졌습니다 다시 로그인해 주세요';
      console.log(err);
    } else if (err instanceof Error) {
      if (err.message = '위변조된 토큰') errMessage = '토큰이 변조되었습니다';
      console.log(err);
    }

    res.status(401).send({
      result: false,
      error: errMessage
    })
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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/index.html'));
});

// 유저 인증 정보
app.get('/user/verify', (req, res) => {
  try {
    const { serial: userSerial, id: userID } = req.user;
    // 유저 검증 미들웨어 문제
    if (!req.user || !userID) throw new Error('유저 검증에 문제가 있습니다');

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

    res.status(401).send({
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
    if (!req.user || !userID) throw new Error('유저 검증에 문제가 있습니다');
    // 로그인하지 않음
    if (!userSerial || userID === 'anonymous') throw new CustomError('로그인 정보가 없습니다');

    await mySQL.beginTransaction();
    const [result] = await mySQL.query<UserSQLTable[]>(
      `SELECT user_serial, id
      FROM user
      WHERE user_serial='${userSerial}'`
    );

    // DB 읽기 오류
    if (!result[0]) throw new CustomError('존재하지않는 유저입니다');

    res.send({
      result: result[0],
      error: false,
    });
  } catch (err) {
    await mySQL.rollback();

    let errMessage = '알 수 없는 오류입니다';
    let statusCode = 400;
    if (err instanceof CustomError) {
      if (err.message === '로그인 정보가 없습니다') statusCode = 401;
      errMessage = err.message;
    } else {
      console.log(err);
      statusCode = 500;
    }

    res.status(statusCode).send({
      result: false,
      error: errMessage
    });
  } finally {
    mySQL.release();
  }
});

app.get('/board', (req, res) => {
  const { serial } = req.query;

  const cookieObject = {
    page: 'board',
    serial
  }

  res.cookie('redirect', cookieObject, {
    path: '/',
    maxAge: 60000
  });

  res.redirect('/')
});

app.get('/coin', (req, res) => {
  const { market } = req.query;

  const cookieObject = {
    page: 'coin',
    market,
    marketName: typeof market === 'string' ? req?.marketName[market] : undefined
  }

  res.cookie('redirect', cookieObject, {
    path: '/',
    maxAge: 60000
  });

  res.redirect('/')
});



//404 Middleware
app.use((req, res, next) => { // 404 처리 부분
  res.status(404).sendFile(path.join(__dirname, '/public/404.html'));
});

//Error Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => { // 에러 처리 부분
  console.error(err.stack); // 에러 메시지 표시
  // res.send('error')
  res.redirect('/500')
  res.status(500).sendFile(path.join(__dirname, '/public/500.html'));
});

// Create an HTTPS service identical to the HTTP service.
https.createServer(options, app).listen(app.get('httpsPort'), () => {
  console.log('server is running on ' + app.get('httpsPort'));
});

// Create an HTTP service.
http.createServer(app).listen(app.get('httpPort'), () => {
  console.log('server is running on ' + app.get('httpPort'));
});
