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

app.get('/domain', (req, res) => {
  res.send(process.env.DOMAIN);
})







//jwt 인증 라우터
const jwt = require(path.join(__dirname, './modules/jwt'));

/** 
 * 토큰 검증 함수 
 * @param {token} token
 * @returns 위변조된 토큰일 시 => return false
 * @returns 이상 없을 시 => return payload
*/
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
  const payload = JSON.parse(Buffer.from(encodedPayload, 'base64').toString('utf-8'));
  console.log('payload:', payload)
  return payload;
}

//토큰 검증 middleware
app.use((req, res, next) => {
  const { accessToken } = req.cookies;
  if (!accessToken) {
    req.user = {
      id: 'anonymous'
    }
    return next();
  }

  try {
    console.log('JWT Token Exam -', accessToken);
    const payload = jwtExam(accessToken);
    if (!payload) throw new Error('poisoned cookie');

    req.user = {
      serial: payload.serial,
      id: payload.userid,
    }
    next();
  } catch (error) {
    req.user = {
      id: 'anonymous'
    }
    next();
  }
});









app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
})



// 금액 충전
app.post('/user/charge', async (req, res) => {
  const mySQL = await mySQLPool.getConnection(async conn => conn);

  try {
    if (req.user.id === 'anonymous') throw new Error('로그인정보 없음');
    if (!req.user) throw new Error('토큰검증에 문제');

    const [dbResult] = await mySQL.query(
      `UPDATE user
      SET money=money+1000000, charge=charge+1
      WHERE id='${req.user.id}'`
    );

    await mySQL.commit();

    res.send({
      result: dbResult,
      error: false,
    });
  } catch (error) {
    console.log(error)
    await mySQL.rollback();
    res.send({
      result: false,
      error: error,
    })
  } finally {
    mySQL.release();
  }
});



// 게시판 - 게시글 list data
app.get("/board/data", async (req, res) => {
  console.log('SQL Request - 게시판 리스트 요청');
  const mySQL = await mySQLPool.getConnection(async conn => conn);

  try {
    await mySQL.beginTransaction();
    const [resSQL] = await mySQL.query(`SELECT board_serial, user_serial, user_id, title, content, date 
    FROM board
    ORDER BY board_serial DESC
    `);
    // await mySQL.commit();

    res.send({
      result: {
        sqlData: resSQL,
        userData: req.user,
      },
      error: false,
    });
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
  const { serial, id } = req.user;
  const mySQL = await mySQLPool.getConnection(async conn => conn);

  console.log('SQL Request - 게시글 추가')
  try {
    if (!serial) throw new Error('유저 로그인 정보가 없습니다');
    await mySQL.beginTransaction();

    const [result] = await mySQL.query(`INSERT INTO board(user_serial, user_id, title, content, date)
    VALUES(${serial}, '${id}', '${title}', '${content}', NOW())`);

    await mySQL.commit();

    if (result.affectedRows) res.send({ result: true, error: false });
    else throw new Error('db 추가 실패');

  } catch (error) {
    await mySQL.rollback();
    console.error(error);
    // 400 bad request
    // 에러 세분화 필요
    let code = '00';
    if (error.message === '유저 로그인 정보가 없습니다') code = '01';
    res.send({
      result: false,
      error: code
    })
    // res.status(400).send({ result: false, error: error });
  } finally {
    mySQL.release();
  }

});

// 게시글 put
app.put("/board/put/:id", async (req, res) => {
  const { id } = req.params;
  const { postSerial, title, content } = req.body;
  const { serial } = req.user;
  const mySQL = await mySQLPool.getConnection(async conn => conn);


  console.log('SQL Request - 게시글 수정')
  try {
    await mySQL.beginTransaction();

    // 게시글 작성자와 로그인한 유저가 동일한지 확인
    const [resSQL1] = await mySQL.query(`SELECT user_serial
    FROM board
    WHERE board_serial=${postSerial}`);

    const { user_serial } = resSQL1[0];
    if (serial !== user_serial) throw new Error('유저 정보 불일치');

    // 게시물 수정
    const [resSQL2] = await mySQL.query(`UPDATE board
    SET title='${title}', content='${content}'
    WHERE board_serial='${postSerial}'`);

    await mySQL.commit();

    if (resSQL2.affectedRows) res.send({ result: true, error: false });
    else throw new Error('db 수정 실패');

  } catch (error) {
    // 400 bad request
    // 에러 세분화 필요
    console.log(error)
    res.send({ result: false, error: error });
  } finally {
    mySQL.release();
  }

});

// 게시글 read
app.get('/board/:serial', async (req, res) => {
  const { serial } = req.params;
  const userData = req.user;
  const mySQL = await mySQLPool.getConnection(async conn => conn);

  try {
    await mySQL.beginTransaction();

    console.log('SQL Request - 게시글', serial, '번')

    const [resSQL1] = await mySQL.query(`SELECT *
    FROM board 
    WHERE board_serial=${serial}`);

    const [resSQL2] = await mySQL.query(`SELECT * 
    FROM comment 
    WHERE board_serial=${serial}`);

    // await mySQL.commit();

    if (!resSQL1) throw new Error('db error')

    const objectSend = {
      result: {
        boardData: resSQL1[0],
        commentData: resSQL2,
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
app.delete('/board/delete/:serial', async (req, res) => {
  const { serial } = req.params;
  const mySQL = await mySQLPool.getConnection(async conn => conn);



  try {
    await mySQL.beginTransaction();
    const [resSQL1] = await mySQL.query(`SELECT user_serial
    FROM board
    WHERE board_serial='${serial}'`);
    const { user_serial } = resSQL1[0];

    if (user_serial !== req.user.serial && req.user.id !== 'admin') throw new Error('유저 정보 불일치');

    const [delResult] = await mySQL.query(`DELETE FROM board
    WHERE board_serial='${serial}';`);
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




app.post('/comment/add', async (req, res) => {
  const mySQL = await mySQLPool.getConnection(async conn => conn);

  try {
    if (!req.user.serial) throw new Error('로그인 필요');

    await mySQL.beginTransaction();

    const [resSQL] = await mySQL.query(
      `INSERT INTO comment(user_serial, user_id, board_serial, content, date, reply)
      VALUES(${req.user.serial}, '${req.user.id}', '${req.body.serial}', '${req.body.content}', NOW(), ${req.body.reply})`
    );

    await mySQL.commit();

    res.send({
      result: {
        sqlData: resSQL,
        userData: req.user
      },
      error: false
    })

  } catch (error) {
    await mySQL.rollback();
    console.log(error)

    res.send({
      result: false,
      error: error,
    });

  } finally {
    mySQL.release();
  }

});

app.put('/comment/put', async (req, res) => {
  const mySQL = await mySQLPool.getConnection(async conn => conn);

  try {
    if (!req.user.serial) throw new Error('로그인 필요');

    await mySQL.beginTransaction();

    const reqSerial = req.body.serial;
    const reqcontent = req.body.content;
    const [resSQL] = await mySQL.query(
      `UPDATE comment
      SET content=${reqcontent}
      WHERE comment_serial=${reqSerial}`
    )

    await mySQL.commit();

    res.send({
      result: {
        sqlData: resSQL,
        userData: req.user
      },
      error: false
    })

  } catch (error) {
    await mySQL.rollback();
    console.log(error)

    res.send({
      result: false,
      error: error,
    });

  } finally {
    mySQL.release();
  }



})

















// 구글 로그인 창 표시
app.get('/login/google', (req, res) => {
  const { GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI } = process.env;

  const GOOGLE_OAUTH_URI = 'https://accounts.google.com/o/oauth2/v2/auth';
  const queryClientID = '?client_id=' + GOOGLE_CLIENT_ID;
  const queryRedirectURI = '&redirect_uri=' + GOOGLE_REDIRECT_URI;
  const queryResponseType = '&response_type=code';
  const queryScope = '&scope=email profile';

  res.redirect(GOOGLE_OAUTH_URI + queryClientID + queryRedirectURI + queryResponseType + queryScope);
})

// code를 얻어 google api에 token 요청 후 token으로 사용자 정보 재요청
app.get('/google/redirect', async (req, res) => {
  // code
  const { code } = req.query;
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;

  const mySQL = await mySQLPool.getConnection(async conn => conn);

  try {
    // code 발급이 정상적으로 되지 않았을 경우
    if (!code) throw new Error('google code error');

    const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
    // token요청
    const res1 = await axios.post(GOOGLE_TOKEN_URL, {
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code: code,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    });
    const token = res1.data.access_token;
    // 토큰 발급이 정상적으로 되지 않았을 경우
    if (!token) throw new Error('google token error');

    // 사용자 정보 요청
    const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
    const res2 = await axios.get(GOOGLE_USERINFO_URL, {
      headers: {
        Authorization: 'Bearer' + token,
      },
    });
    console.log(res2.data);
    // 사용자 정보를 불러오는데 실패
    if (!res2.data) throw new Error('fail to load google userinfo');
    const id = 'google-' + res2.data.id;

    // 가입되어있는 id인지 검사
    let [resSQL1] = await mySQL.query(`SELECT user_serial 
      FROM user
      WHERE id='${id}'`);

    if (!resSQL1.length) {
      //미가입
      const [resSQL2] = await mySQL.query(`INSERT INTO user(id) 
      VALUES('${id}')`);

      [resSQL1] = await mySQL.query(`SELECT user_serial 
      FROM user
      WHERE id='${id}'`);
    }
    const { user_serial } = resSQL1[0];

    const payload = {
      serial: user_serial,
      userid: id,
      exp: '추가예정'
    };

    //JWT 생성
    const jwtToken = jwt.createToken(payload);

    console.log('토큰', jwtToken)
    // 생성한 토큰을 쿠키로 만들어서 브라우저에게 전달
    res.cookie('accessToken', jwtToken, {
      path: '/',
      HttpOnly: true
    });

    await mySQL.commit();

    res.redirect('http://localhost:3000/');
  } catch (error) {
    console.log(error)
    await mySQL.rollback();

    res.send({
      result: false,
      error: error
    });
  } finally {
    mySQL.release();
  }

})


app.delete('/comment/delete/:serial', async (req, res) => {
  const mySQL = await mySQLPool.getConnection(async conn => conn);
  const reqCommentSerial = req.params.serial;

  try {
    if (!req.user.serial) throw new Error('로그인 필요');

    await mySQL.beginTransaction();

    const [resSQL1] = await mySQL.query(`SELECT *
    FROM comment 
    WHERE comment_serial=${reqCommentSerial}`);

    if (req.user.id !== 'admin' && resSQL1[0].user_serial !== req.user.serial) throw new Error('유저 불일치');

    const [resSQL2] = await mySQL.query(`DELETE FROM comment 
    WHERE comment_serial=${reqCommentSerial}`);

    await mySQL.commit();
    console.log('삭제')
    res.send({
      result: true,
      error: false
    })

  } catch (error) {
    await mySQL.rollback();
    console.log(error)

    res.send({
      result: false,
      error: error,
    });

  } finally {
    mySQL.release();
  }
});








// 유저 인증 정보
app.get('/user/verify', (req, res) => {
  const userData = req.user.id;
  console.log(req.user)
  console.log("유저 데이터 요청", userData);
  res.send(userData);
});

// 유저 프로필 정보
app.get('/user/profile', async (req, res, next) => {

  const mysql = await mySQLPool.getConnection(async conn => conn);

  try {
    await mysql.beginTransaction();
    const [result] = await mysql.query(
      `SELECT id, money, charge
      FROM user
      WHERE id='${req.user.id}'`
    );
    // await mysql.commit();

    res.send({
      result: result[0],
      error: false,
    });
  } catch (error) {
    await mysql.rollback();
    console.log(error)
  } finally {
    mysql.release();
  }
  // const userData = req.user;
  // console.log("유저 프로필 요청", userData);
  // res.send(userData);
});

// 유저 코인 정보
app.get('/user/coin', (req, res, next) => {
  if (!req.user.serial) {
    res.send({
      result: 'anonymouse',
      error: false,
    });
  } else next();
}, async (req, res) => {

  const { market } = req.query;
  console.log(market)
  const mySQL = await mySQLPool.getConnection(async conn => conn);

  try {
    await mySQL.beginTransaction();

    const [result] = await mySQL.query(
      `SELECT price, amount
      FROM coin
      WHERE market='${market}' AND user_serial=${req.user.serial}`
    );

    const [result2] = await mySQL.query(
      `SELECT money
      FROM user
      WHERE user_serial=${req.user.serial}`
    );

    if (!result[0]) result.push({ amount: 0 });

    result[0].money = result2[0].money;
    console.log(result)

    res.send({
      result: result[0],
      error: false,
    });
  } catch (error) {
    await mySQL.rollback();
    console.log(error)

    res.send({
      result: false,
      error: error,
    });

  } finally {
    mySQL.release();
  }

});

// app.get('/coindata/:market', async (req, res) => {
//   console.log(req.body)
//   console.log(req.params)
//   console.log(123123123)
//   const resData = {
//     market: gMarket,
//     ticker: gTicker
//   }
//   res.send(resData);
// });



app.post('/user/coin/trade', async (req, res) => {
  const mySQL = await mySQLPool.getConnection(async conn => conn);

  const getCoinData = (tickerData, marketName) => {
    let result = false;
    tickerData.forEach((e) => {
      if (e.market === marketName) {
        result = e;
        return false;
      }
    })
    return result;
  }

  const { market, amount } = req.body;
  console.log(req.body)
  // 구매면 true 판매면 false
  let tradeType;

  //요청한 코인의 현재가 확인
  const coinData = getCoinData(gTicker, market);
  const { trade_price } = coinData;

  try {
    await mySQL.beginTransaction();

    if (req.user.id === 'anonymous') throw new Error('user data null');

    // 유저의 요청한 코인 보유 수량 불러오기
    let [result2] = await mySQL.query(
      `SELECT *
      FROM coin
      WHERE user_serial=${req.user.serial} AND market='${market}'`
    );

    // 보유수량이 없으면 수량이 0인 객체 생성
    const userOwnData = result2[0] || {
      price: 0,
      amount: 0
    };
    userOwnData.price = Number(userOwnData.price);
    userOwnData.amount = Number(userOwnData.amount);

    if (req.body.request === 'buy') {
      tradeType = true;

      // 유저의 현금 불러오기
      let [result1] = await mySQL.query(
        `SELECT *
                FROM user
                WHERE user_serial=${req.user.serial}`
      );

      // 돈이 부족한지 확인
      const userData = result1[0];
      if (userData.money < amount * trade_price) throw new Error('not enough money')

      // 요청한 코인 수량 및 평단가 반영
      userOwnData.price = (userOwnData.amount * userOwnData.price + trade_price * amount) / (userOwnData.amount + amount);
      userOwnData.amount = userOwnData.amount + amount;

      // 현금 차감
      const [result3] = await mySQL.query(
        `UPDATE user
        SET money=money-${trade_price * amount}
        WHERE user_serial='${req.user.serial}'`
      );
    }
    else if (req.body.request === 'sell') {
      tradeType = false;
      if (userOwnData.amount < amount) throw new Error('not enough coin');

      // 요청한 코인 수량 및 평단가 반영
      userOwnData.price = userOwnData.amount !== amount ?
        (userOwnData.amount * userOwnData.price - trade_price * amount) / (userOwnData.amount - amount) :
        0;
      userOwnData.amount = userOwnData.amount - amount;


      // 현금 증액
      const [result3] = await mySQL.query(
        `UPDATE user
        SET money=money+${trade_price * amount}
        WHERE user_serial='${req.user.serial}'`
      );
    }

    else throw new Error('trade request error');

    // 보유 코인 수정
    if (userOwnData.coin_serial) {
      const [result4] = await mySQL.query(
        `UPDATE coin
        SET price=${userOwnData.price}, amount=${userOwnData.amount}
        WHERE user_serial='${req.user.serial}' AND market='${market}'`
      )
    } else {
      const [result4] = await mySQL.query(
        `INSERT INTO coin(user_serial, market, price, amount)
        VALUES(${req.user.serial}, '${market}', ${userOwnData.price}, ${userOwnData.amount})`
      );
    }

    // 매매 히스토리 기록
    const [result5] = await mySQL.query(
      `INSERT INTO trade(user_serial, trading, market, date)
      VALUES(${req.user.serial}, ${tradeType}, '${market}', NOW())`
    );

    await mySQL.commit();

    res.send({
      result: true,
      error: false,
    });

  } catch (error) {
    await mySQL.rollback();
    console.log(error)

    let code = '00';
    if (error.message === 'user data null') code = '01';
    if (error.message === 'not enough money') code = '02';

    res.send({
      result: false,
      error: code
    });

  } finally {
    mySQL.release();
  }
});



app.get('/board', (req, res) => {
  res.cookie('navigate', '1243', {
    path: '/',
  });
  res.sendFile(path.join(__dirname, '/public/index.html'));
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