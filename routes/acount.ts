import express from 'express';
import crypto from 'crypto';
import { mySQLPool, UserSQLTable } from '../modules/database'
import { RowDataPacket } from 'mysql2/promise';
import { createToken, hashing, Payload } from '../modules/jwt';
import axios from 'axios';


const router = express.Router();

class CustomError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CustomError';
  }
}
interface User extends RowDataPacket {
  user_serial: number,
  id: string,
  salt: string,
  money: number,
  charge: number
}
interface HashPWResult {
  salt: string,
  key: string
}
type HashPW = (pw: string, salt?: string) => { result: HashPWResult | false, error: string | false };


//패스워드 해시화 함수
const hashPW: HashPW = (pw, salt = undefined) => {
  try {
    salt = salt || crypto.randomBytes(64).toString('hex');
    const repeat: number = Number(process.env.HASH_REPEAT_NUM);
    if (!process.env.HASH_ALGORITHM) throw new Error('해시알고리즘이 없습니다')

    const algorithm = process.env.HASH_ALGORITHM;
    const key = crypto.pbkdf2Sync(pw, salt, repeat, 64, algorithm).toString('hex');
    return {
      result: {
        salt: salt,
        key: key
      },
      error: false
    };

  } catch (error) {
    if (error instanceof CustomError) {
      return {
        result: false,
        error: error.message
      };
    } else {
      return {
        result: false,
        error: String(error)
      };
    }
  }
}


// 로그인 요청
router.post('/login', async (req, res) => {
  const mySQL = await mySQLPool.getConnection();

  try {
    const { loginID, loginPW } = req.body;
    if (!loginPW) throw new CustomError('no password');
    if (!loginID) throw new CustomError('no id');
    if (/[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]|\s/g.test(loginID)) throw new CustomError('입력할 수 없는 문자가 섞여있습니다');


    // db에서 요청한 ID에 해당하는 data 가져옴
    const [resSQL] = await mySQL.query<User[]>(`SELECT *
    FROM user
    WHERE id='${loginID}'
    `);

    // db에 ID가 존재하지 않음
    if (!resSQL[0]) throw new CustomError('존재하지 않는 아이디입니다');
    const { user_serial, id, salt, hash } = resSQL[0];

    // 로그인 요청한 PW 해시화
    const { result: hashResult, error: hashError } = hashPW(loginPW, salt);
    // 해시화 실패
    if (hashError) throw new Error(hashError);
    if (!hashResult) throw new Error('해시화에 실패하였습니다');

    const { key } = hashResult;
    if (key != hash) throw new CustomError('비밀번호가 틀렸습니다');

    const agentSalt = crypto.randomBytes(64).toString('hex')

    // payload
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


    const expDate = new Date();
    expDate.setHours(expDate.getHours() + 1)

    // 생성한 토큰을 쿠키로 만들어서 브라우저에게 전달
    res.cookie('accessToken', token, {
      path: '/',
      httpOnly: true,
      maxAge: 3600000,
      secure: true,
      sameSite: 'strict',
    });

    // 로그인 성공했음을 response
    res.send({
      result: {
        serial: user_serial,
        id
      },
      error: false,
    });
  } catch (err) {
    await mySQL.rollback();

    let errMessage = '알 수 없는 오류입니다';
    let statusCode = 400;
    if (err instanceof CustomError) {
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

//로그아웃
router.get('/logout', (req, res) => {
  res.cookie('accessToken', '', {
    path: '/',
    httpOnly: true,
    maxAge: 0
  });

  res.send(true)
})


//회원가입 요청
router.post('/register', async (req, res) => {
  const { regId: reqStrID, regPw: reqStrPW } = req.body;

  const mySQL = await mySQLPool.getConnection();

  try {
    // 요청한 ID String이 없을 경우
    if (!reqStrID) throw new CustomError('아이디를 입력해주세요');
    // 요청한 Password String이 없을 경우
    if (!reqStrPW) throw new CustomError('비밀번호를 입력해주세요');
    if (reqStrID.length < 4) throw new CustomError('아이디는 4글자 이상만 사용할 수 있습니다');
    if (reqStrPW.length < 8) throw new CustomError('패스워드는 8자 이상 입력해주세요');


    // 중복 ID 검사
    const [resSQL1] = await mySQL.query<UserSQLTable[]>(`SELECT * 
    FROM user
    WHERE id='${reqStrID}'`);

    // 중복되는 ID가 있음
    if (resSQL1[0]) throw new CustomError('이미 가입되어있는 아이디입니다');

    // PW Hash화
    const { result, error } = hashPW(reqStrPW);

    const { key, salt } = result || { key: null, salt: null };
    // 해시화에 실패 했을 경우 - key salt 생성 실패
    if (!key || !salt) throw new Error('해시화에 실패했습니다');
    // 해시화에 실패 했을 경우 - 기타 오류
    if (error) throw new Error('해시화에 실패했습니다');

    const [resSQL2] = await mySQL.query(`INSERT INTO user(id, salt, hash) 
    VALUES('${reqStrID}', '${salt}', '${key}')`);

    await mySQL.commit();

    // DB 입력 실패
    // if (!('affectedRows' in resSQL2) || !resSQL2.affectedRows) throw new CustomError('04');

    res.send({
      result: true,
      error: false,
    })
  } catch (err) {
    await mySQL.rollback();

    let errMessage = '알 수 없는 오류입니다';
    let statusCode = 400;
    if (err instanceof CustomError) {
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


// 패스워드 변경
router.patch('/user/password', async (req, res) => {
  const mySQL = await mySQLPool.getConnection();

  try {
    const { current, change } = req.body;
    if (typeof current !== 'string' || typeof change !== 'string') throw new CustomError('');

    const { serial: userSerial, id: userID } = req.user;
    // 유저 검증 미들웨어 문제
    if (!req.user || !userID) throw new Error('유저 검증에 문제가 있습니다');
    // 로그인하지 않음
    if (!userSerial || userID === 'anonymous') throw new CustomError('로그인 정보가 없습니다');

    if (/google-\d+/.test(userID)) throw new CustomError('')

    // 유저 정보 확인
    const [resSQL1] = await mySQL.query<User[]>(`SELECT *
      FROM user
      WHERE user_serial='${userSerial}'
    `);

    // db에 ID가 존재하지 않음
    if (!resSQL1[0]) throw new CustomError('존재하지 않는 유저 정보입니다');
    const { salt, hash } = resSQL1[0];

    // 로그인 요청한 PW 해시화
    const { result: hashResult, error: hashError } = hashPW(current, salt);
    // 해시화 실패
    if (hashError) throw new Error(hashError);
    if (!hashResult) throw new Error('해시화에 실패했습니다');

    const { key } = hashResult;
    if (key != hash) throw new Error('해시화에 실패했습니다');

    // 새로운 PW Hash화
    const { result, error } = hashPW(change);

    const { key: newHash, salt: newSalt } = result || { key: null, salt: null };
    // 해시화에 실패 했을 경우 - key salt 생성 실패
    if (!newHash || !newSalt) throw new Error('해시화에 실패했습니다');
    // 해시화에 실패 했을 경우 - 기타 오류
    if (error) throw new Error('해시화에 실패했습니다');

    await mySQL.query(
      `UPDATE user
      SET salt = '${newSalt}', hash = '${newHash}'
      WHERE user_serial=${userSerial}`
    )

    await mySQL.commit();

    res.cookie('accessToken', '', {
      path: '/',
      httpOnly: true,
      maxAge: 0
    });

    res.status(201).send({
      result: true,
      error: false
    })

  } catch (err) {
    await mySQL.rollback();

    let errMessage = '알 수 없는 오류입니다';
    let statusCode = 400;
    if (err instanceof CustomError) {
      if (err.message === '로그인 정보가 없습니다') statusCode = 401;
      if (err.message === '존재하지 않는 유저 정보입니다') statusCode = 401;
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
})

// 탈퇴
router.delete('/user', async (req, res) => {
  const mySQL = await mySQLPool.getConnection();

  try {
    const { serial: userSerial, id: userID } = req.user;
    // 유저 검증 미들웨어 문제
    if (!req.user || !userID) throw new Error('유저 검증에 문제가 있습니다');
    // 로그인하지 않음
    if (!userSerial || userID === 'anonymous') throw new CustomError('로그인 정보가 없습니다');

    // 유저 정보 확인
    const [resSQL1] = await mySQL.query<User[]>(`
      SELECT *
      FROM user
      WHERE user_serial='${userSerial}'
    `);

    // db에 ID가 존재하지 않음
    if (!resSQL1[0]) throw new CustomError('존재하지 않는 유저입니다');

    // const [resSQL2] = await mySQL.query(`
    //   DELETE 
    //   FROM comment 
    //   WHERE user_serial=${userSerial}
    // `);

    // const [resSQL3] = await mySQL.query(`
    //   DELETE 
    //   FROM board
    //   WHERE user_serial=${userSerial}
    // `);

    // const [resSQL4] = await mySQL.query(`
    //   DELETE 
    //   FROM trade
    //   WHERE user_serial=${userSerial}
    // `);

    // const [resSQL5] = await mySQL.query(`
    //   DELETE 
    //   FROM coin
    //   WHERE user_serial=${userSerial}
    // `);

    // const [resSQL6] = await mySQL.query(`
    //   DELETE 
    //   FROM user
    //   WHERE user_serial=${userSerial}
    // `);

    // const [resSQL2] = await mySQL.query(`
    //   DELETE
    //   FROM comment, board, trade, coin, user
    //     USING comment JOIN board JOIN trade JOIN coin JOIN user
    //     ON comment.user_serial = board.user_serial
    //     AND board.user_serial = trade.user_serial
    //     AND trade.user_serial = coin.user_serial
    //     AND coin.user_serial = user.user_serial
    //   WHERE comment.user_serial = ${userSerial} 
    // `);

    await mySQL.query(`
      DELETE FROM comment WHERE user_serial = ?;
      DELETE FROM board WHERE user_serial = ?;
      DELETE FROM trade WHERE user_serial = ?;
      DELETE FROM coin WHERE user_serial = ?;
      DELETE FROM user WHERE user_serial = ?;
    `, [userSerial, userSerial, userSerial, userSerial, userSerial]);

    await mySQL.commit();

    res.cookie('accessToken', '', {
      path: '/',
      httpOnly: true,
      maxAge: 0
    });


    res.send({
      result: true,
      error: false
    })
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
})


// 구글 로그인 페이지로 리다이렉션 라우터
router.get('/login/google', (req, res) => {
  const { GOOGLE_CLIENT_ID } = process.env;
  const GOOGLE_REDIRECT_URI = 'https://' + req.hostname + '/google/redirect';
  const GOOGLE_OAUTH_URI: string = 'https://accounts.google.com/o/oauth2/v2/auth';
  const queryClientID = '?client_id=' + GOOGLE_CLIENT_ID;
  const queryRedirectURI = '&redirect_uri=' + GOOGLE_REDIRECT_URI;
  const queryResponseType: string = '&response_type=code';
  const queryScope: string = '&scope=email profile';

  res.redirect(GOOGLE_OAUTH_URI + queryClientID + queryRedirectURI + queryResponseType + queryScope);
})

// 사용자 정보 요청 api
// 쿼리스트링으로 구글코드를 받아 google api에 토큰을 요청 후 응답받은 토큰으로 사용자 정보 재요청
router.get('/google/redirect', async (req, res) => {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
  const GOOGLE_REDIRECT_URI = 'https://' + req.hostname + '/google/redirect';

  const mySQL = await mySQLPool.getConnection();

  try {
    const { code } = req.query;
    // 구글코드 발급이 정상적으로 되지 않았을 경우
    if (typeof code !== 'string') throw new CustomError('구글에 정보 요청하는데에 있어 문제가 발생했습니다');

    const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
    // 토큰 요청
    const res1 = await axios.post(GOOGLE_TOKEN_URL, {
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code: code,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    const token = res1?.data.access_token;
    // 토큰 발급이 정상적으로 되지 않았을 경우
    if (typeof token !== 'string') throw new CustomError('구글에 정보 요청하는데에 있어 문제가 발생했습니다');

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
    if (!res2.data.id) throw new CustomError('구글에 정보 요청하는데에 있어 문제가 발생했습니다');
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
      if (!('affectedRows' in resSQL2) || !resSQL2.affectedRows) throw new CustomError('06');

      // 해당 아이디 정보
      const [resSQL3] = await mySQL.query<UserSQLTable[]>(`SELECT user_serial 
        FROM user
        WHERE id='${userID}'`
      );

      // DB에서 회원정보를 불러오는데 실패
      if (!resSQL3[0].user_serial) throw new CustomError('DB 에러');

      user_serial = resSQL3[0].user_serial;
    }
    await mySQL.commit();
    const agentSalt = crypto.randomBytes(64).toString('hex');

    const payload = {
      serial: user_serial,
      userid: userID,
      adress: hashing(req.ip),
      agent: hashing(req.header('User-Agent') || '', agentSalt),
      salt: agentSalt
    };

    // JWT 생성
    const jwtToken = createToken(payload);

    // JWT토큰생성 실패
    if (!jwtToken) throw new Error('토큰 생성에 실패했습니다');

    const expDate = new Date();
    expDate.setHours(expDate.getHours() + 1)

    // 생성한 토큰을 쿠키로 만들어서 브라우저에게 전달
    res.cookie('accessToken', jwtToken, {
      path: '/',
      httpOnly: true,
      maxAge: 3600000,
      secure: true,
      sameSite: 'strict',
    });

    res.redirect('/');
  } catch (err) {
    await mySQL.rollback();

    let errMessage = '알 수 없는 오류입니다';
    let statusCode = 400;
    if (err instanceof CustomError) {
      if (err.message === '구글에 정보 요청하는데에 있어 문제가 발생했습니다') statusCode = 502;
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

})



module.exports = router;