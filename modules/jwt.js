const router = require('express').Router();
const path = require('path');
const crypto = require('crypto');

//dotenv
require('dotenv').config();

const salt = process.env.SALT;

//JWT 인코딩 함수
const encode = (text) => {
  const encodedText = Buffer.from(JSON.stringify(text))
    .toString('base64')
    .replace(/=/g, '');
  return encodedText;
};


//JWT 토큰 생성 함수

// iss : Issuer. 토큰 발급자를 나타낸다.
// sub : Subject. 토큰 제목을 나타낸다.
// aud : Audience. 토큰 대상자를 나타낸다.
// exp : Expiration Time. 토큰 만료 시각을 나타낸다. Numeric Date 형식으로 나타낸다.
// nbf : Not Before. 토큰의 활성 시각을 나타낸다. 쉽게 말해, 이 시각 전에는 토큰이 유효하지 않다는 의미이다. Numeric Date 형식으로 나타낸다.
// iat : Issued At. 토큰이 발급된 시각을 나타낸다. Numeric Date 형식으로 나타낸다. 이 값으로 토큰이 발급된지 얼마나 오래됐는지 확인할 수 있다.
// jti : JWT ID. JWT 의 식별자를 나타낸다.
const createToken = (payload) => {
  //JWT의 구성 요소 header.payload.signature

  //header
  const header = {
    typ: 'JWT',
    alg: 'HS512'
  };

  //encoding
  const encodedHeader = encode(header);
  const encodedPayload = encode(payload);

  //signature
  const signature = createSignature(encodedHeader, encodedPayload);

  const token = encodedHeader + '.' + encodedPayload + '.' + signature;

  return token;
}

//signature 생성 함수
const createSignature = (encodedHeader, encodedPayload) => {
  const repeat = parseInt(process.env.HASH_REPEAT_NUM);
  const algorithm = process.env.HASH_ALGORITHM;
  const plainText = encodedHeader + '.' + encodedPayload;
  const signature = crypto.pbkdf2Sync(plainText, salt, repeat, 64, algorithm)
  .toString('base64')
  .replace(/=/g, '');

  
  // crypto.createHmac('sha256', salt)
  //   .update(encodedHeader + '.' + encodedPayload)
  //   .digest('base64')
  //   .replace(/[=]/g, '');

  return signature;
};



module.exports = {
  createToken: createToken,
  createSignature: createSignature,
};