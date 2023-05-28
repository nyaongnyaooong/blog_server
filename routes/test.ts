const alertMessage: (errorCode: string) => string = (errorCode) => {
  if (errorCode = '01') return '제목이나 내용을 입력하지 않았습니다';
  if (errorCode = '02') return '유저 검증에 문제가 있습니다';
  if (errorCode = '03') return '로그인 정보가 없습니다';
  if (errorCode = '04') return '존재하지 않는 게시물입니다';
  if (errorCode = '05') return '게시물에 접근 권한이 없습니다';
  if (errorCode = '06') return 'DB 업데이트에 실패하였습니다';

  if (errorCode = '07') return '구글 코드를 받아오는데 실패했습니다';
  if (errorCode = '08') return '구글 토큰을 받아오는데 실패했습니다';
  if (errorCode = '09') return '구글 사용자 정보를 받아오는데 실패했습니다';
  if (errorCode = '10') return 'JWT 토큰 생성에 실패했습니다';

  if (errorCode = '11') return '요청한 마켓과 일치하는 ticker 데이터를 찾을 수 없습니다';
  if (errorCode = '12') return 'KRW이 충분하지 않습니다';
  if (errorCode = '13') return '판매 요청한 코인 수량이 보유한 수량보다 많습니다';

  return '알 수 없는 오류입니다';
}



import express from 'express';
const app = express();

// 유저 인증 정보
app.get('/user/verify', (req, res) => {
  try {
    // 유저 검증 미들웨어 문제
    if (!req.user || !('id' in req.user)) throw new Error('02');
    // 로그인하지 않음
    if (!req.user.serial || req.user.id === 'anonymous') throw new Error('03');
  } catch (err) {

  }
});


const obj: { name?: string } = {
  name: 'kim'
}

if(!('name' in obj)) throw new Error('')
if(!obj.name) throw new Error('')
console.log(obj)