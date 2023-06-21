"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashing = exports.createSignature = exports.createToken = void 0;
const crypto_1 = __importDefault(require("crypto"));
//JWT 인코딩 함수
/**
 * @param text 인코딩할 객체
 * @returns 인코딩 후 결과값
 */
const encode = (text) => {
    const encodedText = Buffer.from(JSON.stringify(text))
        .toString('base64')
        .replace(/=/g, '');
    return encodedText;
};
//JWT 토큰 생성 함수
/**
 * @param payload 페이로드
 * @returns JWT를 string 형식으로 반환
 *
 * iss : Issuer. 토큰 발급자를 나타낸다.
 * sub : Subject. 토큰 제목을 나타낸다.
 * aud : Audience. 토큰 대상자를 나타낸다.
 * exp : Expiration Time. 토큰 만료 시각을 나타낸다. Numeric Date 형식으로 나타낸다.
 * nbf : Not Before. 토큰의 활성 시각을 나타낸다. 쉽게 말해, 이 시각 전에는 토큰이 유효하지 않다는 의미이다. Numeric Date 형식으로 나타낸다.
 * iat : Issued At. 토큰이 발급된 시각을 나타낸다. Numeric Date 형식으로 나타낸다. 이 값으로 토큰이 발급된지 얼마나 오래됐는지 확인할 수 있다.
 * jti : JWT ID. JWT 의 식별자를 나타낸다.
 */
const createToken = (payload) => {
    //header
    const header = {
        typ: 'JWT',
        alg: 'HS512',
    };
    // 헤더와 페이로드 인코딩
    const encHeader = encode(header);
    const encPayload = encode(payload);
    // 인코딩된 헤더와 페이로드로 시그니쳐 생성
    const signature = createSignature(encHeader, encPayload);
    if (signature) {
        // 헤더.페이로드.시그니쳐를 연결하여 만든 토큰 반환
        return encHeader + '.' + encPayload + '.' + signature;
    }
    return false;
};
exports.createToken = createToken;
//signature 생성 함수
const createSignature = (encHeader, encPayload) => {
    // 해쉬 반복 횟수
    const repeat = Number(process.env.HASH_REPEAT_NUM);
    // 해쉬 알고리즘
    const algorithm = process.env.HASH_ALGORITHM;
    // 솔트
    const salt = process.env.SALT;
    const plainText = encHeader + '.' + encPayload;
    if (salt && algorithm) {
        const signature = crypto_1.default.pbkdf2Sync(plainText, salt, repeat, 64, algorithm)
            .toString('base64')
            .replace(/=/g, '');
        return signature;
    }
    return false;
};
exports.createSignature = createSignature;
const hashing = (plainText, inputSalt = '') => {
    // 해쉬 반복 횟수
    const repeat = Number(process.env.HASH_REPEAT_NUM);
    // 해쉬 알고리즘
    const algorithm = process.env.HASH_ALGORITHM;
    // 솔트
    const salt = inputSalt || process.env.SALT;
    if (salt && algorithm)
        return crypto_1.default.pbkdf2Sync(plainText, salt, repeat, 64, algorithm)
            .toString('base64')
            .replace(/=/g, '');
    else
        return '';
};
exports.hashing = hashing;
