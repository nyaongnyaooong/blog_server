//express
const express = require('express');
const app = express();

//path, fs
const path = require('path');
const fs = require('fs');

//express 모듈에 body-parser내장
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//method-override for RESTFUL API
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

//axios
const axios = require('axios');

//dotenv
require('dotenv').config();

//cookie parser
const cookieParser = require('cookie-parser');
app.use(cookieParser());

//CORS
const cors = require('cors');
app.use(cors());

// var indexRouter = require('./routes/index');
// var usersRouter = require('./routes/users');

//Static File (/ 라우터 포함)
app.use(express.static('public'));

const { mySQLPool, AtlasDB } = require('./modules/db')



// 유저 데이터 관련 라우터
app.use('/', require(path.join(__dirname, './routes/acount.js')));

// 메인 blog 관련 라우터
app.use('/', require(path.join(__dirname, './routes/blog.js')));

// 코인 모의투자 라우터
app.use('/', require(path.join(__dirname, './routes/coin.js')));





// ---------------------------------------------------------



let gMarket = null;
let gTicker = null;
const getTicker = async () => {
  try {
    const option1 = {
      method: 'get',
      url: "https://api.upbit.com/v1/market/all?isDetails=false",
      headers: {
        accept: "application/json"
      }
    };
    const res1 = await axios.request(option1);
    const allMarket = res1.data;
    gMarket = [];

    let krwMrkStr = '';
    allMarket.forEach(elm => {
      if (elm.market.includes('KRW')) {
        gMarket.push(elm)
        krwMrkStr += krwMrkStr ? ', ' + elm.market : elm.market;
      }
    });

    setInterval(async () => {
      const option2 = {
        method: 'get',
        url: "https://api.upbit.com/v1/ticker?markets=" + krwMrkStr,
        headers: {
          accept: "application/json"
        }
      };
      const res2 = await axios.request(option2);
      gTicker = res2.data;
    }, 1000);

  } catch (error) {

  }
}

getTicker();














//jwt 인증 라우터
const jwt = require(path.join(__dirname, './modules/jwt'));

// 토큰 검증 함수
const jwtExam = (token) => {
  // JWT Token : Header . Payload . Signature
  const splitToken = token.split('.');

  const encodedHeader = splitToken[0];
  const encodedPayload = splitToken[1];
  const signature = splitToken[2];

  // Header와 Payload로 Signature 생성
  const tokenSignature = jwt.createSignature(encodedHeader, encodedPayload);

  // token Signature와 비교하여 검증
  if (signature != tokenSignature) return false;

  //payload를 디코딩하여 req.user에 넣음
  //JSON => 자바스크립트 객체화
  const user = JSON.parse(Buffer.from(encodedPayload, 'base64').toString('utf-8'));
  return user;
}

//토큰 검증 middleware
app.use((req, res, next) => {
  try {
    const { accessToken } = req.cookies;
    if (!accessToken) throw new Error('no cookie');

    console.log('JWT Token Exam -', accessToken);
    const userData = jwtExam(accessToken);
    if (!userData) throw new Error('poisoned cookie');

    req.user = { ...userData };
    next();
  } catch {
    req.user = 'anonymous';
    next();
  }
});


// 게시판 - 게시글 list data read
app.get("/board/data", async (req, res) => {
  console.log('SQL Request - 게시판 리스트 요청');
  const mySQL = await mySQLPool.getConnection(async conn => conn);

  try {
    await mySQL.beginTransaction();
    let [result] = await mySQL.query(`SELECT board_serial, user_serial, title, content, date 
    FROM board
    ORDER BY board_serial DESC
    `);
    await mySQL.commit();
    res.send(result);
  } catch (error) {
    await mySQL.rollback();
    console.error(error);
  } finally {
    mySQL.release();
  }
});


// 게시글 create
app.post("/board/post", async (req, res) => {
  const { title, content } = req.body;
  const { userid } = req.user;
  const mySQL = await mySQLPool.getConnection(async conn => conn);

  console.log('SQL Request - 게시글 추가')
  try {
    if (!userid) throw new Error('유저 로그인 정보가 없습니다');
    await mySQL.beginTransaction();

    const [result] = await mySQL.query(`INSERT INTO board(title, content, created, author, view)
    VALUES('${title}', '${content}', NOW(), '${userid}', 0)`);

    await mySQL.commit();

    if (result.affectedRows) res.send({ result: true, error: false });
    else throw new Error('db 추가 실패');

  } catch (error) {
    await mySQL.rollback();
    console.error(error);
    // 400 bad request
    // 에러 세분화 필요
    res.status(400).send({ result: false, error: error });
  } finally {
    mySQL.release();
  }

});



// 게시글 put
app.put("/board/put/:id", async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const { userid } = req.user;
  const mySQL = await mySQLPool.getConnection(async conn => conn);


  console.log('SQL Request - 게시글 수정')
  try {
    await mySQL.beginTransaction();

    const [checkResult] = await mySQL.query(`SELECT author
    FROM board
    WHERE id='${id}'`);
    const { author } = checkResult[0];
    if (author !== userid) throw new Error('유저 정보 불일치');

    const [putResult] = await mySQL.query(`UPDATE board
    SET title='${title}', content='${content}'
    WHERE id='${id}'`);

    await mySQL.commit();

    if (putResult.affectedRows) res.send({ result: true, error: false });
    else throw new Error('db 수정 실패');

  } catch (error) {
    // 400 bad request
    // 에러 세분화 필요
    res.send({ result: false, error: error });
  } finally {
    mySQL.release();
  }

});

// 게시글 read
app.get('/board/:id', async (req, res) => {
  const { id } = req.params;
  const userData = req.user;
  const mySQL = await mySQLPool.getConnection(async conn => conn);

  try {
    await mySQL.beginTransaction();

    console.log('SQL Request - 게시글', id, '번')
    const [putRes] = await mySQL.query(`UPDATE board
    SET view=view+1
    WHERE id='${id}';`);
    const [rows] = await mySQL.query(`SELECT id, title, content, author, view, created 
    FROM board 
    WHERE id=${id}`);

    await mySQL.commit();

    if (!rows) throw new Error('db error')

    const objectSend = {
      result: {
        sqlData: rows[0],
        userData: userData,
      },
      error: false,
    };
    // console.log('게시글 sql요청', objectSend);
    res.send(objectSend);
  } catch (error) {
    console.error(error)
    const objectSend = {
      result: false,
      error: error,
    };
    res.send(objectSend);
  } finally {
    mySQL.release();
  }
});

// board delete
app.delete('/board/delete/:id', async (req, res) => {
  const { id } = req.params;
  const mySQL = await mySQLPool.getConnection(async conn => conn);



  try {
    await mySQL.beginTransaction();
    const [checkResult] = await mySQL.query(`SELECT author
    FROM board
    WHERE id='${id}'`);
    const { author } = checkResult[0];

    if (author !== req.user.userid) throw new Error('유저 정보 불일치');

    const [delResult] = await mySQL.query(`DELETE FROM board
    WHERE id='${id}';`);
    // console.log(delResult);

    await mySQL.commit();

    if (delResult.affectedRows) res.send({ result: true, error: false });
    else throw new Error('db 삭제 실패');

  } catch (error) {
    // 400 bad request
    // 에러 세분화 필요
    res.send({ result: false, error: error });
  } finally {
    mySQL.release();
  }

});








app.get('/userdata', (req, res) => {
  const userData = req.user;
  console.log("유저 데이터 요청", userData);
  res.send(userData);
});

app.get('/coindata', async (req, res) => {
  const resData = {
    market: gMarket,
    ticker: gTicker
  }
  res.send(resData);
});

app.get('/coindata/:market', async (req, res) => {
  console.log(req.body)
  console.log(req.params)
  const resData = {
    market: gMarket,
    ticker: gTicker
  }
  res.send(resData);
});



















//admin 페이지
app.get('/:htmlFileName', async (req, res, next) => {
  try {
    const { htmlFileName } = req.params;
    const htmlFileFullDir = __dirname + '/public/' + htmlFileName + '.html';
    res.sendFile(htmlFileFullDir);
  } catch (err) {
    console.error(err);
  }

});





//404 Middleware
app.use((req, res, next) => { // 404 처리 부분
  console.log('404');
  res.status(404).send('일치하는 주소가 없습니다!');
});

//Error Middleware
app.use((err, req, res, next) => { // 에러 처리 부분
  console.error(err.stack); // 에러 메시지 표시
  res.status(500).send('서버 에러!'); // 500 상태 표시 후 에러 메시지 전송
});

app.listen(8080, () => {
  console.log('listening on 8080');
});


// market: 'KRW-BTC',
// trade_date: '20230417',
// trade_time: '131839',
// trade_date_kst: '20230417',
// trade_time_kst: '221839',
// trade_timestamp: 1681737519482,
// opening_price: 39612000,
// high_price: 39673000,
// low_price: 38540000,
// trade_price: 38685000,
// prev_closing_price: 39607000,
// change: 'FALL',
// change_price: 922000,
// change_rate: 0.0232787134,
// signed_change_price: -922000,
// signed_change_rate: -0.0232787134,
// trade_volume: 0.00516996,
// acc_trade_price: 156602392900.84137,
// acc_trade_price_24h: 200017140205.17203,
// acc_trade_volume: 4007.04945898,
// acc_trade_volume_24h: 5099.99614325,
// highest_52_week_price: 53075000,
// highest_52_week_date: '2022-04-21',
// lowest_52_week_price: 20700000,
// lowest_52_week_date: '2022-12-30',
// timestamp: 1681737519538


// market	종목 구분 코드	String
// trade_date	최근 거래 일자(UTC)
// trade_time	최근 거래 시각(UTC)
// trade_date_kst	최근 거래 일자(KST)
// trade_time_kst	최근 거래 시각(KST)
// trade_timestamp	최근 거래 일시(UTC)
// opening_price	시가	Double
// high_price	고가	Double
// low_price	저가	Double
// trade_price	종가(현재가)	Double
// prev_closing_price	전일 종가(UTC 0시 기준)	Double
// change	EVEN : 보합 RISE : 상승 FALL : 하락	String
// change_price	변화액의 절대값	Double
// change_rate	변화율의 절대값	Double
// signed_change_price	부호가 있는 변화액	Double
// signed_change_rate	부호가 있는 변화율	Double
// trade_volume	가장 최근 거래량	Double
// acc_trade_price	누적 거래대금(UTC 0시 기준)	Double
// acc_trade_price_24h	24시간 누적 거래대금	Double
// acc_trade_volume	누적 거래량(UTC 0시 기준)	Double
// acc_trade_volume_24h	24시간 누적 거래량	Double
// highest_52_week_price	52주 신고가	Double
// highest_52_week_date	52주 신고가 달성일
// lowest_52_week_price	52주 신저가	Double
// lowest_52_week_date	52주 신저가 달성일
// timestamp	타임스탬프	Long