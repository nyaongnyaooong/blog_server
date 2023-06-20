import express from 'express';
import { RowDataPacket } from 'mysql2/promise';

/*
  Types
*/
import { Market, Ticker, Payload } from '../index.d';
import { mySQLPool, UserSQLTable, BoardSQLTable, CommentSQLTable, CoinSQLTable, TradeSQLTable } from '../modules/database';
import { ResultSetHeader } from 'mysql2';


const router = express.Router();

class CustomError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CustomError';
  }
}


// 게시판 게시글 리스트 api
router.get("/board/data", async (req, res) => {
  const mySQL = await mySQLPool.getConnection();

  try {
    await mySQL.beginTransaction();

    const [resSQL] = await mySQL.query<BoardSQLTable[]>(`SELECT *
      FROM board
      ORDER BY board_serial DESC
    `);

    const [resSQL2] = await mySQL.query<BoardSQLTable[]>(`SELECT board_serial, COUNT(*) AS comments
      FROM comment 
      GROUP BY board_serial;
    `);

    res.send({
      result: {
        sqlData: {
          boardList: resSQL,
          commentsList: resSQL2
        },
        userData: req.user,
      },
      error: false,
    });
  } catch (err) {
    await mySQL.rollback();

    res.status(503).send({
      result: false,
      error: '리스트를 가져오는데 문제가 발생했습니다',
    });

    console.error('게시글 List에서 에러발생');
    console.error(err);
  } finally {
    mySQL.release();
  }
});

// 게시글 생성 라우터
router.post("/board", async (req, res) => {
  const mySQL = await mySQLPool.getConnection();

  try {
    const { title: reqPostTitle, content: reqPostContent } = req.body;
    // body 데이터가 정상적으로 들어오지 않거나 값이 없음
    if (typeof reqPostTitle !== 'string' || reqPostTitle === '') throw new CustomError('제목을 입력하지 않았습니다');
    if (typeof reqPostContent !== 'string' || reqPostContent === '') throw new CustomError('내용을 입력하지 않았습니다');

    const { serial: userSerial, id: userID } = req.user;
    // 유저 검증 미들웨어 문제
    if (!req.user || !userID) throw new Error('유저 검증에 문제가 있습니다');
    // 로그인하지 않음
    if (!userSerial || userID === 'anonymous') throw new CustomError('로그인 정보가 없습니다');

    await mySQL.beginTransaction();

    const [result] = await mySQL.query(`INSERT INTO board(user_serial, user_id, title, content, date)
    VALUES(${userSerial}, '${userID}', '${reqPostTitle}', '${reqPostContent}', NOW())`);

    await mySQL.commit();

    // DB 추가에 실패함
    if (!('affectedRows' in result) || !result.affectedRows) throw new CustomError('DB 업데이트에 실패했습니다');

    res.send({
      result: true,
      error: false
    });

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

});

// 게시글 수정 라우터
router.patch("/board/:serial", async (req, res) => {
  const mySQL = await mySQLPool.getConnection();

  const { serial: reqPostSerial } = req.params;

  try {
    const { title: patchTitle, content: patchContent } = req.body;
    // body 데이터가 정상적으로 들어오지 않음
    if (typeof patchTitle !== 'string' || patchTitle === '') throw new CustomError('제목을 입력하지 않았습니다');
    if (typeof patchContent !== 'string' || patchContent === '') throw new CustomError('내용을 입력하지 않았습니다');

    const { serial: userSerial, id: userID } = req.user;
    // 유저 검증 미들웨어 문제
    if (!req.user || !userID) throw new Error('유저 검증에 문제가 있습니다');
    // 로그인하지 않음
    if (!userSerial || userID === 'anonymous') throw new CustomError('로그인 정보가 없습니다');

    await mySQL.beginTransaction();

    // 게시글 작성자와 로그인한 유저가 동일한지 확인
    const [resSQL1] = await mySQL.query<BoardSQLTable[]>(`SELECT user_serial
    FROM board
    WHERE board_serial=${reqPostSerial}`);

    // 존재하지 않는 게시물
    if (!resSQL1[0]) throw new CustomError('04');

    const { user_serial } = resSQL1[0];
    // 게시물 작성자와 게시물 수정 요청자가 일치하지 않음
    if (userSerial !== user_serial) throw new CustomError('05');

    // 게시물 수정
    const [resSQL2] = await mySQL.query(`UPDATE board
    SET title='${patchTitle}', content='${patchContent}'
    WHERE board_serial='${reqPostSerial}'`);

    await mySQL.commit();

    if (!('affectedRows' in resSQL2) || !resSQL2.affectedRows) throw new CustomError('DB 업데이트에 실패했습니다');

    res.status(201).send({
      result: true,
      error: false
    });

  } catch (err) {
    let errMessage = '알 수 없는 오류입니다';
    if (err instanceof CustomError) {
      errMessage = err.message;
    } else {
      console.log(err);
    }

    res.status(201).send({
      result: false,
      error: errMessage
    });
  } finally {
    mySQL.release();
  }

});

// 게시글 읽기 페이지
router.get('/board/:serial', async (req, res) => {
  const mySQL = await mySQLPool.getConnection();

  const { serial: reqPostSerial } = req.params;
  try {
    const { serial: userSerial, id: userID } = req.user;
    // 유저 검증 미들웨어 문제
    if (!req.user || !userID) throw new Error('유저 검증에 문제가 있습니다');

    await mySQL.beginTransaction();

    const [resSQL1] = await mySQL.query<BoardSQLTable[]>(`
      SELECT *
      FROM board 
      WHERE board_serial=${reqPostSerial}`
    );

    const [resSQL2] = await mySQL.query<CommentSQLTable[]>(`
      SELECT * 
      FROM comment 
      WHERE board_serial=${reqPostSerial}`
    );

    // 게시물이 존재하지 않음
    if (!resSQL1[0]) throw new CustomError('게시물이 존재하지 않습니다');

    // view 쿠키값을 읽어오며 쿠키가 없으면 빈 객체
    const view = req.cookies.view || {};

    // 요청한 게시글의 view 정보가 없거나 false라면 
    if (!view[reqPostSerial]) {
      // true로 만듬
      view[reqPostSerial] = true;

      // view 숫자 증가
      await mySQL.query<CommentSQLTable[]>(`
        UPDATE board
        SET view=view+1
        WHERE board_serial=${reqPostSerial}`
      );

      // if (!('affectedRows' in resSQL3) || !resSQL3.affectedRows) throw new CustomError('DB 업데이트에 실패했습니다');

      // 쿠키의 만료일을 금일 자정으로
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + 1)
      expDate.setHours(0);
      expDate.setMinutes(0);
      expDate.setSeconds(0);

      res.cookie('view', view, {
        path: '/',
        httpOnly: true,
        expires: expDate
      });
    }

    res.send({
      result: {
        boardData: resSQL1[0],
        commentData: resSQL2,
        userData: req.user,
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



// 게시물 삭제
router.delete('/board/:serial', async (req, res) => {
  const mySQL = await mySQLPool.getConnection();

  const { serial: reqPostSerial } = req.params;

  try {
    const { serial: userSerial, id: userID } = req.user;
    // 유저 검증 미들웨어 문제
    if (!req.user || !userID) throw new Error('유저 검증에 문제가 있습니다');
    // 로그인하지 않음
    if (!userSerial || userID === 'anonymous') throw new CustomError('로그인 정보가 없습니다');

    await mySQL.beginTransaction();

    const [resSQL1] = await mySQL.query<BoardSQLTable[]>(`SELECT *
    FROM board
    WHERE board_serial=${reqPostSerial}`);

    // 게시물이 존재하지 않음
    if (!resSQL1[0]) throw new CustomError('존재하지 않는 게시물입니다');
    const { user_serial } = resSQL1[0];

    // 게시물 작성자와 로그인한 유저가 불일치
    if (userSerial !== user_serial && userID !== 'admin') throw new CustomError('해당 게시물의 작성자가 아닙니다');

    // const resSQL2 = await mySQL.query(`
    //   DELETE FROM a, b
    //   USING comment AS a LEFT JOIN board AS b
    //   ON a.board_serial = b.board_serial
    //   WHERE a.board_serial = ${reqPostSerial}
    // `);

    const resSQL2 = await mySQL.query(`
      DELETE FROM comment, board
      USING comment LEFT JOIN board
      ON comment.board_serial = board.board_serial
      WHERE comment.board_serial = ${reqPostSerial}
    `);

    await mySQL.commit();

    res.send({
      result: true,
      error: false
    });

  } catch (err) {
    await mySQL.rollback();
    
    let errMessage = '알 수 없는 오류입니다';
    let statusCode = 400;
    if (err instanceof CustomError) {
      if(err.message === '로그인 정보가 없습니다') statusCode = 401;
      if(err.message === '해당 게시물의 작성자가 아닙니다') statusCode = 403;
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

// 댓글 추가 api
router.post('/comment', async (req, res) => {
  const mySQL = await mySQLPool.getConnection();

  try {
    const { content: reqContent } = req.body;
    const reqSerial = Number(req.body.serial);
    const reqCommentType = Number(req.body.reply);

    // body 데이터의 타입이 다르거나 댓글 내용이 없음
    if (isNaN(reqSerial)) throw new CustomError('잘못된 요청입니다');
    if (typeof reqContent !== 'string' || reqContent === '') throw new CustomError('내용을 입력해주세요');
    if (isNaN(reqCommentType)) throw new CustomError('잘못된 요청입니다');

    const { serial: userSerial, id: userID } = req.user;
    // 유저 검증 미들웨어 문제
    if (!req.user || !userID) throw new Error('유저 검증에 문제가 있습니다');
    // 로그인하지 않음
    if (!userSerial || userID === 'anonymous') throw new CustomError('로그인 정보가 없습니다');

    await mySQL.beginTransaction();

    const [resSQL] = await mySQL.query<ResultSetHeader>(
      `INSERT INTO comment(user_serial, user_id, board_serial, content, date, reply)
      VALUES(${req.user.serial}, '${req.user.id}', ${reqSerial}, '${reqContent}', NOW(), ${reqCommentType})`
    );

    await mySQL.commit();

    // DB 업데이트 실패
    // if (resSQL instanceof ResultSetHeader)
    // if (!('affectedRows' in resSQL) || !resSQL.affectedRows) throw new CustomError('DB 업데이트에 실패했습니다');

    res.send({
      result: {
        sqlData: {
          insertId: resSQL.insertId
        },
        userData: req.user
      },
      error: false
    });

  } catch (err) {
    await mySQL.rollback();
    
    let errMessage = '알 수 없는 오류입니다';
    let statusCode = 400;
    if (err instanceof CustomError) {
      if(err.message === '로그인 정보가 없습니다') statusCode = 401;
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

// 댓글 수정 api
router.patch('/comment', async (req, res) => {
  const mySQL = await mySQLPool.getConnection();

  try {
    const { reqContent } = req.body;
    const reqSerial = Number(req.body.reqSerial);
    // body 데이터가 정상적으로 들어오지 않음
    if (isNaN(reqSerial) || typeof reqContent !== 'string' || reqContent === '') throw new CustomError('01');

    const { serial: userSerial, id: userID } = req.user;
    // 유저 검증 미들웨어 문제
    if (!req.user || !userID) throw new Error('유저 검증에 문제가 있습니다');
    // 로그인하지 않음
    if (!userSerial || userID === 'anonymous') throw new CustomError('로그인 정보가 없습니다');

    await mySQL.beginTransaction();

    const [resSQL1] = await mySQL.query<CommentSQLTable[]>(
      `SELECT *
      From comment
      WHERE comment_serial=${reqSerial}`
    )

    // 댓글이 존재하지 않음
    if (!resSQL1[0]) throw new CustomError('댓글이 존재하지 않습니다');
    const { user_serial } = resSQL1[0];

    // 댓글 작성자와 로그인한 유저가 불일치
    if (userSerial !== user_serial && userID !== 'admin') throw new CustomError('수정 권한이 없습니다');

    await mySQL.query(
      `UPDATE comment
      SET content='${reqContent}'
      WHERE comment_serial=${reqSerial}`
    )

    await mySQL.commit();

    // DB 업데이트 실패
    // if (!('affectedRows' in resSQL2) || !resSQL2.affectedRows) throw new CustomError('DB 업데이트에 실패했습니다');

    res.status(201).send({
      result: {
        sqlData: true,
        userData: req.user
      },
      error: false
    });

  } catch (err) {
    await mySQL.rollback();
    
    let errMessage = '알 수 없는 오류입니다';
    let statusCode = 400;
    if (err instanceof CustomError) {
      if(err.message === '로그인 정보가 없습니다') statusCode = 401;
      if(err.message === '수정 권한이 없습니다') statusCode = 403;
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








// 댓글 삭제 api 리팩토링
router.delete('/comment/:serial', async (req, res) => {
  const mySQL = await mySQLPool.getConnection();

  try {

    // 올바르지않은 path
    if (!req.params.serial || isNaN(Number(req.params.serial)) || isNaN(Number(req.body.boardSerial))) throw new CustomError('요청이 잘못되었습니다');
    const reqCommentSerial = Number(req.params.serial);
    const reqBoardSerial = Number(req.body.boardSerial);

    const { serial: userSerial, id: userID } = req.user;
    // 유저 검증 미들웨어 문제
    if (!req.user || !userID) throw new Error('유저 검증에 문제가 있습니다');
    // 로그인하지 않음
    if (!userSerial || userID === 'anonymous') throw new CustomError('로그인 정보가 없습니다');

    await mySQL.beginTransaction();

    const [comments] = await mySQL.query<CommentSQLTable[]>(`SELECT *
      FROM comment
      WHERE board_serial=${reqBoardSerial}`
    );

    // 댓글이 존재하지 않음
    if (!comments.length) throw new CustomError('댓글이 존재하지 않습니다');

    // 요청 댓글
    const reqCommentArr = [];
    for (let i = 0; i < comments.length; i++) {
      if (comments[i].comment_serial === reqCommentSerial) {

        reqCommentArr.push(comments[i]);
        break;
      }
    }
    const [reqComment] = reqCommentArr;

    // 댓글 작성 유저와 로그인한 유저가 동일하지 않음
    if (reqComment.user_serial !== userSerial && userID !== 'admin') throw new CustomError('삭제 권한이 없습니다');

    // 대댓글인지확인
    // 대댓글이면
    if (reqComment.reply) {
      //삭제
      const [resSQL] = await mySQL.query(`
        DELETE FROM comment 
        WHERE comment_serial=${reqCommentSerial}`
      );

      // DB 업데이트 실패
      if (!('affectedRows' in resSQL) || !resSQL.affectedRows) throw new CustomError('DB 업데이트에 실패했습니다');

      // 상위 댓글의 대댓글 검색
      const replys: CommentSQLTable[] = [];
      comments.forEach(e => {
        if (e.reply === reqComment.reply) replys.push(e);
      });

      // 상위 댓글확인
      const upperCommentArr: CommentSQLTable[] = [];
      comments.forEach(e => {
        if (e.comment_serial === reqComment.reply) upperCommentArr.push(e);
      });

      const upperComment = upperCommentArr[0];

      // 상위 댓글의 대댓글이 없고 상위 댓글의 erase가 true라면
      if (replys.length < 2 && upperComment.erase) {
        //상위 댓글도 삭제
        await mySQL.query(`
          DELETE FROM comment 
          WHERE comment_serial=${upperComment.comment_serial}`
        );

        // DB 업데이트 실패
        // if (!('affectedRows' in resSQL2) || !resSQL2.affectedRows) throw new CustomError('DB 업데이트에 실패했습니다');
      }

      await mySQL.commit();
      res.send({
        result: {
          commentState: 'delete'
        },
        error: false
      })
    } else {

      // 대댓글이 있는지 확인
      const replys: CommentSQLTable[] = [];
      for (let i = 0; i < comments.length; i++) {
        if (comments[i].reply === reqCommentSerial) replys.push(comments[i]);
      }

      if (replys.length > 0) { // 대댓글이 있으면
        // erase 업데이트
        await mySQL.query<CommentSQLTable[]>(`
          UPDATE comment
          SET erase=1
          WHERE comment_serial=${reqCommentSerial}`
        );

        // DB 업데이트 실패
        // if (!('affectedRows' in resSQL3) || !resSQL3.affectedRows) throw new CustomError('DB 업데이트에 실패했습니다');

        await mySQL.commit();

        res.send({
          result: {
            commentState: 'erase'
          },
          error: false
        })
      } else {  //대댓글이 없으면
        // 삭제
        await mySQL.query(`
          DELETE FROM comment 
          WHERE comment_serial=${reqCommentSerial}`
        );
        // DB 업데이트 실패
        // if (!('affectedRows' in resSQL4) || !resSQL4.affectedRows) throw new CustomError('DB 업데이트에 실패했습니다');

        await mySQL.commit();

        res.send({
          result: {
            commentState: 'delete'
          },
          error: false
        })
      }

    }

  } catch (err) {
    await mySQL.rollback();
    
    let errMessage = '알 수 없는 오류입니다';
    let statusCode = 400;
    if (err instanceof CustomError) {
      if(err.message === '로그인 정보가 없습니다') statusCode = 401;
      if(err.message === '삭제 권한이 없습니다') statusCode = 403;
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










module.exports = router;
