// eslint-disable-next-line

import '../css/board.css'
import axios from 'axios';
import { useState, useEffect } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Loading2 } from './Loading';

class CustomError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CustomError';
  }
}

// 게시판 새로운 글 포스팅 페이지
const BoardPostCreate = (props) => {
  const { setBoardPage } = props.stateFuncs;
  const { setLgnFrmAct, setBgDarkAct, setServerDown } = props.appSetStates;
  const [postContent, setPostContent] = useState('');

  //발행 함수
  const postBoard = async (event) => {
    event.preventDefault();
    const titleValue = event.target.title.value

    try {
      // 제목이나 내용이 공백일 경우
      if (!titleValue.replace(/\s/g, '').length) throw new CustomError('제목을 입력해주세요')
      if (!postContent.replace(/\s/g, '').length) throw new CustomError('내용을 입력해주세요')
      const response = await axios.request({
        method: 'post',
        url: '/board',
        data: {
          title: titleValue,
          content: postContent,
        },
      });

      const { result } = response.data;

      if (result) setBoardPage('home');

    } catch (err) {
      if (err instanceof CustomError) alert(err.message)
      else {
        if (err.message === 'Request failed with status code 500') setServerDown(true)
        else {
          const errorMessage = err.response.data.error;
          alert(errorMessage);
          if (errorMessage === '로그인 정보가 없습니다') {
            setLgnFrmAct(true);
            setBgDarkAct(true);
          } else window.location.href = '/'
        }
      }

    }
  }

  return (
    <div className="content_box ani_fadeIn" id="board">
      <form onSubmit={postBoard}>
        <div className='board_post_title'>
          <input type="text" placeholder='제목' name='title' />
        </div>

        <div className='board_post_content'>
          <CKEditor
            editor={ClassicEditor}
            onChange={(event, editor) => {
              setPostContent(editor.getData());
            }}
          />
        </div>

        <div className='board_post_complete'><button>발행</button></div>
      </form>
    </div>
  )
}

//게시글 수정 페이지
const BoardPostUpdate = (props) => {
  const { serial, postData } = props;
  const { setBoardPage } = props.stateFuncs;
  const { setServerDown } = props.appSetStates;

  let [title, setTitle] = useState(postData.title);
  let content = postData.content;

  // 발행 버튼 - 수정요청 함수
  const putPost = async () => {
    try {
      // 제목이나 내용이 공백일 경우
      if (!title.replace(/\s/g, '').length) throw new CustomError('제목을 입력해주세요')
      if (!content.replace(/\s/g, '').length) throw new CustomError('내용을 입력해주세요')
      const response = await axios.request({
        method: 'patch',
        url: '/board/' + serial,
        data: {
          postSerial: serial,
          title: title,
          content: content,
        },
      });

      setBoardPage('home')

    } catch (err) {
      if (err instanceof CustomError) alert(err.message)
      else {
        if (err.message === 'Request failed with status code 500') setServerDown(true)
        else {
          const errorMessage = err.response.data.error;
          alert(errorMessage)
          window.location.href = '/'
        }
      }
    }
  }

  return (
    <div className="content_box ani_fadeIn" id="board">

      <div className='board_post_title'>
        <input type="text" placeholder='제목' value={title} onChange={(event) => {
          setTitle(event.target.value);
        }} />
      </div>

      <div className='board_post_content'>
        <CKEditor
          editor={ClassicEditor}
          data={postData.content}
          onChange={(event, editor) => {
            content = editor.getData();
          }}
        />
      </div>
      <div className='board_post_complete'><button onClick={putPost}>발행</button></div>

    </div>
  )

}

// 게시판 글 읽는 페이지
const BoardPostRead = (props) => {
  const { serial } = props;
  const { setBoardPage, setBoardSerial, setPostData } = props.stateFuncs
  const { setServerDown } = props.appSetStates;

  /*
    States
  */

  // 게시물 데이터 (객체)
  const [boardData, setBoardData] = useState(null);
  // 댓글 데이터 (객체)
  const [commentData, setCommentData] = useState(null);
  // 현재 접속 유저 정보 (객체)
  const [userData, setUserData] = useState(null);
  // 대댓글 창 state
  const [replyActive, setReplyActive] = useState([]);

  const [isUserMatch, setIsUserMatch] = useState(false);

  // 댓글 데이터 (html)
  const [commentList, setCommentList] = useState([]);

  /*
    Functions
  */

  // 게시물 삭제 요청 함수
  const deletePost = async () => {
    try {
      const response = await axios.delete('/board/' + serial);
      const { result, error } = response.data;

      if (result) setBoardPage('home');
    } catch (err) {
      if (err instanceof CustomError) alert(err.message)
      else {
        let errorMessage = '알 수 없는 에러입니다'
        if (err.response.data.error) errorMessage = err.response.data.error;
        alert(errorMessage)
        window.location.href = '/'
      }
    }
  };

  // 댓글 추가 요청 함수
  const addComment = async (reqContent, reply = 0) => {
    try {
      if (!reqContent) throw new CustomError('댓글을 입력해주세요')
      const response = await axios.request({
        method: 'post',
        url: '/comment',
        data: {
          serial: serial,
          content: reqContent,
          reply: reply,
        },
      });

      const { sqlData, userData } = response.data.result;
      const newCommentData = [...commentData];
      newCommentData.push({
        comment_serial: sqlData.insertId,
        user_serial: userData.serial,
        user_id: userData.id,
        board_serial: serial,
        content: reqContent,
        date: '방금 전',
        reply: reply
      })

      const newState = new Array(newCommentData.length).fill({ type: 'reply', active: false })
      setReplyActive(newState);
      setCommentData(newCommentData);

    } catch (err) {
      if (err instanceof CustomError) alert(err.message)
      else {
        let errorMessage = '알 수 없는 에러입니다'
        if (err.response.data.error) errorMessage = err.response.data.error;
        alert(errorMessage)
        window.location.href = '/'
      }
    }

  };

  // 댓글 삭제 요청 함수
  const delComment = async (reqSerial) => {
    try {
      // 서버에 삭제 요청
      const response = await axios.request({
        method: 'delete',
        url: '/comment/' + reqSerial,
        data: {
          boardSerial: serial
        }
      });

      // 해당 댓글을 삭제처리할지 '삭제된 댓글입니다'로 표기할지 결정
      const { commentState } = response.data.result;

      // 댓글 리스트 배열 복사
      const newCommentData = [...commentData];
      // 댓글 리스트 배열 값 중 삭제 요청한 인덱스 찾기
      const index = newCommentData.findIndex((e) => {
        return e.comment_serial === reqSerial;
      })


      if (newCommentData[index].reply) {
        // 형제 대댓글이 있는지 확인
        let isBrother = false;
        newCommentData.forEach(e => {
          if (e.reply === newCommentData[index].reply && e.comment_serial !== reqSerial) {
            isBrother = true;
            return
          }
        })

        // 형제 대댓글이 없으면
        if (!isBrother) {
          // 부모 댓글 인덱스 검색
          const parentIndex = newCommentData.findIndex((e) => {
            return e.comment_serial === newCommentData[index].reply;
          })

          // 부모 댓글이 '삭제된 댓글입니다' 일 경우 삭제
          if (newCommentData[parentIndex].erase) newCommentData.splice(parentIndex, 1);
        }

        // 본인 삭제
        newCommentData.splice(index, 1);
      } else {
        if (commentState === 'delete') newCommentData.splice(index, 1);
        else if (commentState === 'erase') {  // 삭제요청한 댓글이 대댓글이 아닌 경우
          // '삭제된 댓글입니다' 표시
          newCommentData[index].erase = 1;
        } else throw new CustomError('알 수 없는 에러입니다');
      }

      const newState = new Array(newCommentData.length).fill({ type: 'reply', active: false })
      setReplyActive(newState);
      setCommentData(newCommentData);

    } catch (err) {
      if (err instanceof CustomError) alert(err.message)
      else {
        let errorMessage = '알 수 없는 에러입니다'
        if (err.response.data.error) errorMessage = err.response.data.error;
        alert(errorMessage)
        window.location.href = '/'
      }
    }

  };

  // 댓글 수정 요청 함수
  const patchComment = async (reqContent, reqSerial) => {

    try {
      if (!reqContent) throw new CustomError('댓글을 입력해주세요')
      const response = await axios.request({
        method: 'patch',
        url: 'comment',
        data: {
          reqSerial,
          reqContent,
        },
      });

      const { result, error } = response?.data;
      if (!result || error) throw new CustomError('수정에 실패하였습니다.');

      const newState = [...commentData];
      newState.forEach(e => {
        if (e.comment_serial === reqSerial) {
          e.content = reqContent;
          return false;
        }
      })
      const newState2 = new Array(newState.length).fill({ type: 'reply', active: false })

      setReplyActive(newState2);
      setCommentData(newState);
    } catch (err) {
      if (err instanceof CustomError) alert(err.message)
      else {
        let errorMessage = '알 수 없는 에러입니다'
        if (err.response.data.error) errorMessage = err.response.data.error;
        alert(errorMessage)
        window.location.href = '/'
      }
    }
  };



  // 게시물 데이터 요청
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/board/' + serial);
        const { result } = response.data;

        const { boardData, commentData, userData } = result;

        if (boardData.user_serial === userData.serial || userData.id === 'admin') setIsUserMatch(true);
        setUserData(userData);
        setBoardData(boardData);
        setCommentData(commentData);
        setPostData(boardData);

        const newState = new Array(commentData.length).fill({ type: 'reply', active: false });
        setReplyActive(newState);

      } catch (err) {
        if (err instanceof CustomError) alert(err.message);
        else {
          if (err.message === 'Request failed with status code 500') setServerDown(true)
          else {
            const errorMessage = err.response.data.error;
            alert(errorMessage)
            window.location.href = '/'
          }
        }
      }
    };
    fetchData();
  }, [serial]);

  // 댓글 데이터 > html 변환
  useEffect(() => {
    if (!commentData) return;

    if (commentData.length !== replyActive.length) {
      const newState = new Array(commentData.length).fill({ type: 'reply', active: false });
      setReplyActive(newState);
    }

    /*
      Components
    */
    // 답글 form
    const ReplyInput = (props) => {
      const { type, replySerial } = props;

      if (type === 'reply') {
        return (
          <div className='comment-reply-write'>
            <div className='blank'></div>

            <form onSubmit={(e) => {
              e.preventDefault();
              addComment(e.target.comment_content.value, replySerial);
              e.target.comment_content.value = '';
            }}>
              <div className='comment-reply-text'><textarea name='comment_content' /></div>
              <div className='comment-button'><button type='submit'>등록</button></div>
            </form>
          </div>
        );
      } else if (type === 'patch') {
        return (
          <div className='comment-reply-write'>
            <div className='blank'></div>

            <form onSubmit={(e) => {
              e.preventDefault();
              patchComment(e.target.comment_content.value, replySerial);
              // const newState = new Array(replyActive.length).fill({ type: 'patch', active: false });
              // setReplyActive(newState);
            }}>
              <div className='comment-reply-text'><textarea name='comment_content' /></div>
              <div className='comment-button'><button type='submit'>수정</button></div>
            </form>
          </div>
        );
      }
    }
    // 답글 버튼
    const ButtonReply = (props) => {
      const { index } = props
      return (
        <button onClick={() => {
          // const newState = replyActive.map((e, i) => {
          //   if (index === i && (e.type !== 'reply' || e.active === false)) return { type: 'reply', active: true }
          //   else return { type: 'reply', active: false }
          // });

          const newState = new Array(replyActive.length).fill({ type: 'reply', active: false });
          if (replyActive[index].type !== 'reply' || !replyActive[index].active) newState[index] = { type: 'reply', active: true };
          setReplyActive(newState);
        }}>답글</button>
      )
    }
    // 삭제 버튼
    const ButtonDelete = (props) => {
      const { serial } = props;
      return (
        <button onClick={async () => {
          delComment(serial);
        }}>삭제</button>
      );
    }
    // 수정 버튼
    const ButtonPatch = (props) => {
      const { index } = props;
      return (
        <button onClick={() => {
          // const newState = replyActive.map((e, i) => {
          //   if (index === i && (e.type !== 'patch' || e.active === false)) return { type: 'patch', active: true }
          //   else return { type: 'patch', active: false }
          // });

          const newState = new Array(replyActive.length).fill({ type: 'patch', active: false });
          if (replyActive[index].type !== 'patch' || !replyActive[index].active) newState[index] = { type: 'patch', active: true };
          setReplyActive(newState);
        }}>수정</button>
      )
    }



    // 댓글데이터를 댓글과 대댓글로 분리

    //댓글 array
    const arrComment = [];
    //대댓글 array
    const arrReply = [];
    commentData.forEach((e, i) => {
      e.index = i;
      if (e.reply) arrReply.push(e);
      else arrComment.push(e);
    });

    // 댓글 리스트 html 작성
    const commentHTML = arrComment.map((e, i) => {
      const { comment_serial, user_serial, user_id, content: objContent, date, erase, index } = e;
      const content = erase ? '삭제된 댓글입니다' : objContent;

      // UTC > KST로 변환
      let dateKST_String;
      if (date === '방금 전') {
        dateKST_String = date;
      } else {
        const dateKST = new Date(date)
        dateKST.setHours(dateKST.getHours());
        dateKST_String = dateKST.toLocaleString();
      }

      // 각 댓글에 대댓글이 있는지 확인하여 대댓글 html작성
      const replyHTML = arrReply.map((f, j) => {
        const {
          comment_serial: reply_serial,
          user_serial: reply_user_serial,
          user_id: reply_user_id,
          content: reply_content,
          date: reply_date, reply,
          index
        } = f;

        // mysql의 UTC 를 KST로 변환
        let reply_dateKST_String;
        if (reply_date === '방금 전') reply_dateKST_String = f.date;
        else {
          const reply_dateKST = new Date(f.date)
          reply_dateKST.setHours(reply_dateKST.getHours());
          reply_dateKST_String = reply_dateKST.toLocaleString();
        }

        if (reply === comment_serial) {
          return (
            <div key={j} className='comment-reply-item'>
              <div className='blank'></div>
              <div className='comment-reply-item-content'>
                {/* 아이디 표시 */}
                <div className='comment-item-user'><span>{reply_user_id}</span></div>
                {/* 댓글 내용 */}
                <div className='comment-item-content'><span>{reply_content}</span></div>
                <div className='comment-item-etc'>
                  <div className='comment-item-time'>
                    {/* 댓글 작성시간 */}
                    <div><span>{reply_dateKST_String}</span></div>
                  </div>
                  {
                    userData.serial === reply_user_serial ? (
                      <div className='comment-item-button'>
                        <ButtonPatch index={index} />

                        <ButtonDelete serial={reply_serial} />
                      </div>
                    ) : (
                      <div className='comment-item-button'>
                      </div>
                    )
                  }
                </div>
                {
                  // 수정 버튼을 눌렀을 때 textarea 표시
                  replyActive[index].type === 'patch' && replyActive[index].active ?
                    <ReplyInput type={replyActive[index].type} replySerial={reply_serial} /> :
                    <div style={{ display: 'hidden' }} />
                }
              </div>
            </div>
          )
        }
      })

      return (
        <div key={i} className='comment-item'>
          <div className='comment-item-user'><span>{user_id}</span></div>
          <div className='comment-item-content'><span>{content}</span></div>
          <div className='comment-item-etc'>
            <div className='comment-item-time'><span>{dateKST_String}</span></div>
            {
              // 댓글 주인과 로그인 유저가 같으면 수정 삭제버튼 추가
              userData.serial === user_serial || userData.id === 'admin' ? (
                <div className='comment-item-button'>
                  {/* 수정하기 버튼 */}
                  <ButtonPatch index={index} />
                  {/* 삭제하기 버튼 */}
                  <ButtonDelete serial={comment_serial} />
                  {/* 답글달기 버튼 */}
                  <ButtonReply index={index} />
                </div>
              ) : (
                <div className='comment-item-button'>
                  <ButtonReply index={index} />
                </div>
              )
            }
          </div>
          {
            // 답글 버튼을 눌렀을 때 textarea 표시
            replyActive[index].active ?
              <ReplyInput type={replyActive[index].type} replySerial={comment_serial} /> :
              <div style={{ display: 'hidden' }} />
          }
          {/* 대댓글이 있으면 표시 */}
          <div className='comment-reply-List'>
            {replyHTML}
          </div>
        </div>
      );
    });

    setCommentList(commentHTML);
  }, [commentData, replyActive])



  if (boardData && commentData && userData) {
    return (
      <div className='content_box ani_fadeIn'>
        <div className='content-title'>
          <h2>자유 게시판</h2>
        </div>
        <div className='post-head'>
          <div className='post-title'>
            <div className='text'><h3>{boardData.title}</h3></div>
            <div className='button'><button onClick={() => { setBoardPage('home') }}>메인으로</button></div>
          </div>

          <div className='post-id'>
            {boardData.user_id}
          </div>

          <div className='post-urlUpdate'>
            <div className='post-url'>
              {window.location.origin + '/board?serial=' + serial}
            </div>
            {
              isUserMatch ? (
                <div className='post-update'>
                  <button onClick={() => {
                    setBoardSerial(serial);
                    setBoardPage('update');
                  }}>수정</button>
                  <button onClick={() => {
                    deletePost();
                  }}>삭제</button>
                </div>
              ) : (
                <div />
              )
            }
          </div>

        </div>

        <div className='post-body'>
          <div className='post-content'>
            <div dangerouslySetInnerHTML={{ __html: boardData.content }}>
            </div>
          </div>
        </div>

        <div className='comment'>

          <div className='comment-list'>
            {commentList}
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            addComment(e.target.comment_content.value);
            e.target.comment_content.value = '';
          }}>
            <div className='comment-write'>
              <textarea name='comment_content'>

              </textarea>
            </div>

            <div className='comment-button'>
              <button type='submit'>등록</button>
            </div>
          </form>
        </div>
      </div>
    )
  } else return <Loading2 />
}

// 게시판 홈
const BoardHome = (props) => {
  const { stateFuncs, appSetStates } = props;
  const { setServerDown } = appSetStates;
  const { setBoardPage, stateFunctions } = stateFuncs;

  // 게시물 리스트
  const [postList, setPostList] = useState();
  const [userData, setUserData] = useState({});

  // thead 컴포넌트
  const TableCellTitle = (props) => {
    return (
      <thead>
        <tr className="board_thead_tr">
          <th className="board_title" style={{ textAlign: "center" }}>
            <span>{props.desc1}</span>
          </th>
          <th className='board_author'>
            <span>{props.desc2}</span>
          </th>
          <th className='board_good'>
            <span>{props.desc3}</span>
          </th>
          <th className='board_created'>
            <span>{props.desc4}</span>
          </th>
        </tr>
      </thead>

    );
  }

  // tbody 컴포넌트
  const TableCell = (props) => {
    const { setBoardSerial, setBoardPage } = props.stateFuncs;
    const { title, commentNumber, id, view, date } = props;
    const [created] = date.split("T");

    return (
      <tr onClick={() => {
        setBoardSerial(props.serial);
        setBoardPage('read');
      }} className="board_tbody_tr">

        <td className="board_title">
          <span>{title}</span>
          <span className="board_comment">{commentNumber ? ' ' + commentNumber : ''}</span>
        </td>
        <td className="board_author">
          <span>{id}</span>
        </td>
        <td className="board_view">
          <span>{view}</span>
        </td>
        <td className="board_created">
          <span>{created}</span>
        </td>
      </tr>
    );
  }

  // 게시물 리스트 요청
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/board/data");

        const { sqlData, userData } = response.data.result;
        const { boardList, commentsList } = sqlData;
        setUserData(userData);

        const postArray = [];
        boardList.forEach((e, i) => {
          let comments = 0;
          commentsList.forEach(f => {
            if (f.board_serial === e.board_serial) comments = f.comments;
          })
          postArray.push(
            <TableCell key={i} stateFuncs={stateFuncs} serial={e.board_serial} commentNumber={comments} title={e.title} id={e.user_id} view={e.view} date={e.date} />
          );
        });
        setPostList(postArray);
      } catch (err) {
        if (err instanceof CustomError) alert(err.message)
        else {
          if (err.message === 'Request failed with status code 500') setServerDown(true)
          else {
            const errorMessage = err.response.data.error;
            alert(errorMessage)
            window.location.href = '/'
          }
        }
      }
    };
    fetchData();
  }, []);

  // 게시물 리스트 데이터가 없을 경우에는 로딩 중 화면 표기
  return postList ? (
    <div className="content_box board-main ani_fadeIn">
      <div className='content-title'>
        <h2>자유 게시판</h2>
      </div>

      <div className='button'>
        <button onClick={() => { setBoardPage('create'); }}>글쓰기</button>
      </div>

      <div className='table'>
        <table className="board_table">
          <TableCellTitle desc1="제목" desc2="글쓴이" desc3="조회수" desc4="날짜"></TableCellTitle>
          <tbody>
            {postList}
          </tbody>
        </table>
      </div>

      {/* <div>다음페이지</div> */}
    </div>
  ) : (
    <Loading2 />
  )
}

// 게시판 메인 컴포넌트
const Board = (props) => {
  const { appSetStates, componentSerial: boardSerial, componentPage: boardPage } = props;
  const { setComponentPage: setBoardPage, setComponentSerial: setBoardSerial } = appSetStates

  const [postData, setPostData] = useState(null);

  const stateFuncs = {
    setBoardPage,
    setBoardSerial,
    setPostData,
  }
  if (boardPage === 'home') return <BoardHome stateFuncs={stateFuncs} appSetStates={appSetStates} />
  if (boardPage === 'read') return <BoardPostRead postData={postData} serial={boardSerial} stateFuncs={stateFuncs} appSetStates={appSetStates} />
  if (boardPage === 'create') return <BoardPostCreate stateFuncs={stateFuncs} appSetStates={appSetStates} />
  if (boardPage === 'update') return <BoardPostUpdate postData={postData} serial={boardSerial} stateFuncs={stateFuncs} appSetStates={appSetStates} />
  return <Loading2 />
}

export { Board };