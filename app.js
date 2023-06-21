"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const jwt_1 = require("./modules/jwt");
const database_1 = require("./modules/database");
// Express
const app = (0, express_1.default)();
// dotenv
dotenv_1.default.config();
const options = {
    key: fs_1.default.readFileSync('./key/nyaong.myddns.me-key.pem'),
    cert: fs_1.default.readFileSync('./key/nyaong.myddns.me-crt.pem')
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
const jwtExam = (token) => {
    // JWT Token : Header . Payload . Signature
    const splitToken = token.split('.');
    if (splitToken.length !== 3)
        return false;
    const encHeader = splitToken[0];
    const encPayload = splitToken[1];
    const signature = splitToken[2];
    // Header와 Payload로 Signature 생성
    const tokenSignature = (0, jwt_1.createSignature)(encHeader, encPayload);
    // token Signature와 비교하여 검증
    if (signature != tokenSignature)
        return false;
    //payload를 디코딩하여 req.user에 넣음
    //JSON => 자바스크립트 객체화
    const payload = JSON.parse(Buffer.from(encPayload, 'base64').toString('utf-8'));
    return payload;
};
/**
 * 에러 코드 => 에러 메세지 변환 함수
 * @param errorCode
 * @returns errorMessage
 */
class CustomError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CustomError';
    }
}
/*
  미들웨어
*/
// https redirection
app.use((req, res, next) => {
    if (req.secure)
        next();
    else
        res.redirect("https://" + req.headers.host + req.url);
});
//static file
app.use(express_1.default.static('public'));
//body-parser
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
//cors
app.use((0, cors_1.default)());
//cookie-parser
app.use((0, cookie_parser_1.default)(process.env.COOKIE_SECRET));
//morgan
app.use((0, morgan_1.default)('dev'));
// 토큰 검증 미들웨어
app.use((req, res, next) => {
    var _a, _b;
    const { accessToken } = req.cookies;
    if (!accessToken) {
        req.user = {
            id: 'anonymous'
        };
        return next();
    }
    try {
        // 쿠키에서 페이로드 정보만 parsing하여 디코딩
        const payload = jwtExam(accessToken);
        // jwtExam함수는 위변조된 토큰일 경우 false를 반환합니다
        if (!payload)
            throw new Error('위변조된 토큰');
        const { serial: payloadSerial, userid: payloadUserID, adress: payloadAdress, agent: payloadAgent, salt: payloadAgentSalt } = payload;
        // 페이로드 정보를 읽어오는데 실패
        if (!payloadSerial || !payloadUserID || !payloadAdress || !payloadAgent)
            throw new Error('페이로드 정보를 읽어오는데 실패');
        // ip가 다르면
        if (payloadAdress !== (0, jwt_1.hashing)(req.ip)) {
            // 모바일(안드로이드 / iphone) 환경
            if (((_a = req.header('User-Agent')) === null || _a === void 0 ? void 0 : _a.includes('iPhone')) || ((_b = req.header('User-Agent')) === null || _b === void 0 ? void 0 : _b.includes('Android'))) {
                // 접속 기기가 다르면
                if (payloadAgent !== ((0, jwt_1.hashing)(req.header('User-Agent') || '', payloadAgentSalt)))
                    throw new CustomError('접속환경이 다름');
            }
            else
                throw new CustomError('접속환경이 다름');
        }
        req.user = {
            serial: payloadSerial,
            id: payloadUserID,
        };
        next();
    }
    catch (err) {
        let errMessage = '알 수 없는 오류로 로그아웃됩니다';
        res.cookie('accessToken', '', {
            path: '/',
            httpOnly: true,
            maxAge: 0
        });
        if (err instanceof CustomError) {
            if (err.message = '접속환경이 다름')
                errMessage = '접속환경이 달라졌습니다 다시 로그인해 주세요';
            console.log(err);
        }
        else if (err instanceof Error) {
            if (err.message = '위변조된 토큰')
                errMessage = '토큰이 변조되었습니다';
            console.log(err);
        }
        res.status(401).send({
            result: false,
            error: errMessage
        });
    }
});
/*
  Routers
*/
// 사용자 정보 관련 라우터
app.use('/', require(path_1.default.join(__dirname, '/routes/acount')));
// 코인 모의투자 라우터
app.use('/', require(path_1.default.join(__dirname, '/routes/coin')));
// 자유게시판 관련 라우터
app.use('/', require(path_1.default.join(__dirname, '/routes/board')));
app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '/public/index.html'));
});
// 유저 인증 정보
app.get('/user/verify', (req, res) => {
    try {
        const { serial: userSerial, id: userID } = req.user;
        // 유저 검증 미들웨어 문제
        if (!req.user || !userID)
            throw new Error('유저 검증에 문제가 있습니다');
        res.send({
            result: {
                serial: userSerial,
                id: userID,
            },
            error: false
        });
    }
    catch (err) {
        let errMessage = '알 수 없는 오류입니다';
        if (err instanceof CustomError) {
            errMessage = err.message;
        }
        else {
            console.log(err);
        }
        res.status(401).send({
            result: false,
            error: errMessage
        });
    }
});
// 유저 프로필 정보
app.get('/user/profile', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const mySQL = yield database_1.mySQLPool.getConnection();
    try {
        const { serial: userSerial, id: userID } = req.user;
        // 유저 검증 미들웨어 문제
        if (!req.user || !userID)
            throw new Error('유저 검증에 문제가 있습니다');
        // 로그인하지 않음
        if (!userSerial || userID === 'anonymous')
            throw new CustomError('로그인 정보가 없습니다');
        yield mySQL.beginTransaction();
        const [result] = yield mySQL.query(`SELECT user_serial, id
      FROM user
      WHERE user_serial='${userSerial}'`);
        // DB 읽기 오류
        if (!result[0])
            throw new CustomError('존재하지않는 유저입니다');
        res.send({
            result: result[0],
            error: false,
        });
    }
    catch (err) {
        yield mySQL.rollback();
        let errMessage = '알 수 없는 오류입니다';
        let statusCode = 400;
        if (err instanceof CustomError) {
            if (err.message === '로그인 정보가 없습니다')
                statusCode = 401;
            errMessage = err.message;
        }
        else {
            console.log(err);
            statusCode = 500;
        }
        res.status(statusCode).send({
            result: false,
            error: errMessage
        });
    }
    finally {
        mySQL.release();
    }
}));
app.get('/board', (req, res) => {
    const { serial } = req.query;
    const cookieObject = {
        page: 'board',
        serial
    };
    res.cookie('redirect', cookieObject, {
        path: '/',
        maxAge: 60000
    });
    res.redirect('/');
});
app.get('/coin', (req, res) => {
    const { market } = req.query;
    const cookieObject = {
        page: 'coin',
        market,
        marketName: typeof market === 'string' ? req === null || req === void 0 ? void 0 : req.marketName[market] : undefined
    };
    res.cookie('redirect', cookieObject, {
        path: '/',
        maxAge: 60000
    });
    res.redirect('/');
});
//404 Middleware
app.use((req, res, next) => {
    res.status(404).sendFile(path_1.default.join(__dirname, '/public/404.html'));
});
//Error Middleware
app.use((err, req, res, next) => {
    console.error(err.stack); // 에러 메시지 표시
    // res.send('error')
    res.redirect('/500');
    res.status(500).sendFile(path_1.default.join(__dirname, '/public/500.html'));
});
// Create an HTTPS service identical to the HTTP service.
https_1.default.createServer(options, app).listen(app.get('httpsPort'), () => {
    console.log('server is running on ' + app.get('httpsPort'));
});
// Create an HTTP service.
http_1.default.createServer(app).listen(app.get('httpPort'), () => {
    console.log('server is running on ' + app.get('httpPort'));
});
