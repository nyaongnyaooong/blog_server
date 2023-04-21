const express = require('express');
const router = express.Router();
const path = require('path');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const salt = 'test';

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
  console.log('acount DB connected.');


});

const jwt = require(path.join(__dirname, '../modules/jwt'));



// 로그인 요청
router.post('/login/post', async (req, res) => {
  const { loginID, loginPW, url } = req.body;
  console.log('로그인 요청', req.body)
  try {
    // db에서 요청한 ID에 해당하는 data 가져옴
    const dbResult = await db.collection('user').findOne({ name: loginID });
    if (!dbResult) throw new Error('db');
    const { name, key, salt } = dbResult;
    if (!name) throw new Error('일치하는 아이디가 존재하지 않음');

    // 로그인 요청한 PW 해시화
    const loginKey = hashPW(loginPW, salt);
    if (loginKey.key != key) throw new Error('비밀번호 틀림');

    // payload
    const payload = {
      userid: name,
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
      result: true,
      error: false,
    }; 
    res.send(resResult)
    // res.redirect(url);
    
  } catch (err) {
    console.log(err)
    console.log(typeof(err))
    console.log(err.name)
    console.log(err.message)
    console.log('stack', err.stack);
    const resResult = {
      result: false,
      error: err,
    };
    res.send(resResult);
  }
});



//회원가입 요청
router.post('/register/post', async (req, res) => {
  let { regID, regPW } = req.body;

  try {
    // 중복 ID 검사
    const duplication = await db.collection('user').findOne({ name: regID });
    if (duplication) throw new Error('ID duplicated');

    // PW Hash화
    const { salt, key } = hashPW(regPW);
    const counter = await db.collection('counter').findOne({ pw: '1234' });

    const idNum = counter.lastUserID + 1;
    const dbObject = {
      _id: idNum,
      name: regID,
      key: key,
      salt: salt
    }

    const addUserResult = await db.collection('user').insertOne(dbObject);
    const addCounterResult = await db.collection('counter').updateOne({ pw: '1234' }, { $set: { lastUserID: idNum } });

    const resObject = {
      result: addUserResult,
      error: false
    };

    res.send(resObject)
  } catch (err) {
    console.error(err);
    const resObject = {
      result: false,
      error: err
    };
    res.send(resObject);
  }

});








module.exports = router;