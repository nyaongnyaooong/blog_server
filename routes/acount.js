const express = require('express');
const router = express.Router();
const path = require('path');
// const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const { mySQLPool, AtlasDB } = require('../modules/db')
const jwt = require(path.join(__dirname, '../modules/jwt'));

//dotenv
require('dotenv').config();

const hashPW = (pw, salt) => {
  salt = salt || crypto.randomBytes(64).toString('hex');
  const repeat = parseInt(process.env.HASH_REPEAT_NUM);
  const algorithm = process.env.HASH_ALGORITHM;
  const key = crypto.pbkdf2Sync(pw, salt, repeat, 64, algorithm).toString('hex');
  return {
    salt: salt,
    key: key
  };
}



//MongoDB Atlas Setting
const dbURL = 'mongodb+srv://' + process.env.DB_ID + ':' + process.env.DB_PW + process.env.DB_URL;
const { MongoClient, ServerApiVersion } = require('mongodb');
let db;
MongoClient.connect(dbURL, (err, result) => {
  if (err) {
    return console.log(err);
  }
  db = result.db('project1');
});





// 로그인 요청
router.post('/login/post', async (req, res) => {
  const { loginID, loginPW, url } = req.body;
  const mySQL = await mySQLPool.getConnection(async conn => conn);


  console.log('로그인 요청', req.body)
  try {
    if(!loginPW) throw new Error('no password')
    if(!loginID) throw new Error('no id')


    // db에서 요청한 ID에 해당하는 data 가져옴
    // const dbResult = await db.collection('user').findOne({ name: loginID });
    const [dbResult] = await mySQL.query(`SELECT *
    FROM user
    WHERE id='${loginID}'
    `);
    await mySQL.commit();

    if (!dbResult.length) throw new Error('01');
    const { user_serial, id, salt, hash } = dbResult[0];

    // 로그인 요청한 PW 해시화
    const { key } = hashPW(loginPW, salt);
    if (key != hash) throw new Error('02');

    // payload
    const payload = {
      serial: user_serial,
      userid: id,
      exp: '추가예정'
    };

    //JWT 생성
    const token = jwt.createToken(payload);

    console.log('토큰', token)
    // 생성한 토큰을 쿠키로 만들어서 브라우저에게 전달
    res.cookie('accessToken', token, {
      path: '/',
      HttpOnly: true
    });
    const resResult = {
      result: id,
      error: false,
    };
    res.send(resResult)
    // res.redirect(url);

  } catch (err) {
    await mySQL.rollback();

    console.log(err.name);
    console.log(err.message);
    console.log('stack', err.stack);
    
    let errorMessage = '알 수 없는 에러입니다';
    if (err.message === '01') errorMessage = '아이디가 존재하지 않습니다';
    if (err.message === '02') errorMessage = '패스워드를 확인해 주세요';

    const resResult = {
      result: false,
      error: errorMessage,
    };
    res.send(resResult);
  }
});



//회원가입 요청
router.post('/register/post', async (req, res) => {
  const { regID, regPW } = req.body;
  const mySQL = await mySQLPool.getConnection(async conn => conn);

  try {
    // 중복 ID 검사
    const [dupResult] = await mySQL.query(`SELECT user_serial 
    FROM user
    WHERE id='${regID}'`);
    console.log(dupResult);
    if (dupResult.length) throw new Error('ID duplicated');

    // PW Hash화
    const { salt, key } = hashPW(regPW);

    const [addResult] = await mySQL.query(`INSERT INTO user(id, salt, hash) 
    VALUES(
      '${regID}',
      '${salt}',
      '${key}'
    )`)
    await mySQL.commit();

    res.send({
      result: addResult,
      error: false,
    })
  } catch (err) {
    await mySQL.rollback();
    console.error(err);

    res.send({
      result: false,
      error: err
    });
  } finally {
    mySQL.release();
  }

});








module.exports = router;