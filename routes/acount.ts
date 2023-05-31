import express from 'express';
import crypto from 'crypto';
import { mySQLPool, UserSQLTable } from '../modules/database'
import { RowDataPacket } from 'mysql2/promise';
import { createToken, Payload } from '../modules/jwt';


const router = express.Router();


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
    if (!process.env.HASH_ALGORITHM) throw new Error('No hash algorithm')

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
    if (error instanceof Error) {
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
router.post('/login/post', async (req, res) => {
  type ReqBody = { loginID?: string, loginPW?: string };
  const { loginID, loginPW }: ReqBody = req.body;
  if (typeof mySQLPool === 'string') throw new Error(mySQLPool);

  const mySQL = await mySQLPool.getConnection();

  try {
    if (!loginPW) throw new Error('no password');
    if (!loginID) throw new Error('no id');
    if (/[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]|\s/g.test(loginID)) throw new Error('입력할 수 없는 문자가 섞여있습니다');


    // db에서 요청한 ID에 해당하는 data 가져옴
    const [resSQL] = await mySQL.query<User[]>(`SELECT *
    FROM user
    WHERE id='${loginID}'
    `);

    // db에 ID가 존재하지 않음
    if (!resSQL[0]) throw new Error('01');
    const { user_serial, id, salt, hash } = resSQL[0];

    // 로그인 요청한 PW 해시화
    const { result: hashResult, error: hashError } = hashPW(loginPW, salt);
    // 해시화 실패
    if (hashError) throw new Error(hashError);
    if (!hashResult) throw new Error('03');

    const { key } = hashResult;
    if (key != hash) throw new Error('02');

    // payload
    const payload: Payload = {
      serial: user_serial,
      userid: id,
      exp: '추가예정'
    };

    //JWT 생성
    const token = createToken(payload);
    // 토큰생성 실패
    if (!token) throw new Error('10');

    // cookie(name: string, val: string, options: CookieOptions): this;
    // cookie(name: string, val: any, options: CookieOptions): this;
    // cookie(name: string, val: any): this;
    // 생성한 토큰을 쿠키로 만들어서 브라우저에게 전달
    res.cookie('accessToken', token, {
      path: '/',
      httpOnly: true
    });

    // 로그인 성공했음을 response
    res.send({
      result: id,
      error: false,
    });
  } catch (error) {
    await mySQL.rollback();

    if (error instanceof Error) {
      let errorMessage = '알 수 없는 에러입니다';
      if (error.message === '01') errorMessage = '아이디가 존재하지 않습니다';
      if (error.message === '02') errorMessage = '패스워드를 확인해 주세요';
      if (error.message === '03') errorMessage = '해시화에 실패했습니다';
      if (error.message === '10') errorMessage = 'JWT 토큰생성에 실패했습니다';

      res.send({
        result: false,
        error: errorMessage,
      });
    }

    res.send({
      result: false,
      error: String(error)
    });
  }
});


//회원가입 요청
router.post('/register/post', async (req, res) => {
  interface Body {
    regID: string | undefined | null,
    regPW: string | undefined | null
  }
  const { regID: reqStrID, regPW: reqStrPW }: Body = req.body;

  const mySQL = await mySQLPool.getConnection();

  try {
    // 요청한 ID String이 없을 경우
    if (!reqStrID) throw new Error('01');
    // 요청한 Password String이 없을 경우
    if (!reqStrPW) throw new Error('02');

    // 중복 ID 검사
    const [resSQL1] = await mySQL.query<UserSQLTable[]>(`SELECT * 
    FROM user
    WHERE id='${reqStrID}'`);

    // 중복되는 ID가 있음
    if (resSQL1[0]) throw new Error('ID duplicated');

    // PW Hash화
    const { result, error } = hashPW(reqStrPW);

    const { key, salt } = result || { key: null, salt: null };
    // 해시화에 실패 했을 경우 - key salt 생성 실패
    if (!key || !salt) throw new Error('03');
    // 해시화에 실패 했을 경우 - 기타 오류
    if (error) throw new Error('03');

    const [resSQL2] = await mySQL.query(`INSERT INTO user(id, salt, hash) 
    VALUES('${reqStrID}', '${salt}', '${key}')`);

    await mySQL.commit();
    if ('affectedRows' in resSQL2 && resSQL2.affectedRows) {
      res.send({
        result: true,
        error: false,
      })
    } else {
      // DB 입력 실패
      throw new Error('04');
    }
  } catch (error) {
    await mySQL.rollback();

    if (error instanceof Error) {
      let errorMessage = '알 수 없는 에러입니다';
      if (error.message === '01') errorMessage = '입력 받은 아이디가 없습니다'
      if (error.message === '02') errorMessage = '입력 받은 패스워드가 없습니다'
      if (error.message === '03') errorMessage = '입력 받은 패스워드가 없습니다'
      if (error.message === '04') errorMessage = '사용자 정보를 데이터베이스에 업로드하지 못했습니다'

      res.send({
        result: false,
        error: errorMessage
      });
    }

    res.send({
      result: false,
      error: String(error)
    });
  } finally {
    mySQL.release();
  }

});

module.exports = router;