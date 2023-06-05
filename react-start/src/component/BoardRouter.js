// eslint-disable-next-line

import '../css/Board.css'
import axios from 'axios';
import { useState, useEffect } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Loading2 } from './Loading';

// 게시판 새로운 글 포스팅 페이지
const BoardPostCreate = (props) => {
  const { setBoardPage } = props.stateFuncs;
  const { setLgnFrmAct, setBgDarkAct } = props.stateFunctions;
  let title = '';
  let postData = '';

  //발행 함수
  const postBoard = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.request({
        method: 'post',
        url: '/board/post',
        data: {
          title: title,
          content: postData,
        },
      });

      const { result, error } = response.data;
      if (error) throw new Error(error);

      if (result) setBoardPage('home');

    } catch (err) {
      alert(err.message);
      if (err.message === '로그인 정보가 없습니다') {
        setLgnFrmAct(true);
        setBgDarkAct(true);
      }
    }
  }

  return (
    <div className="content_box ani_fadeIn" id="board">
      <form onSubmit={postBoard}>
        <div className='board_post_title'>
          <input type="text" placeholder='제목' onChange={(event) => {
            title = event.target.value;
          }} />
        </div>

        <div className='board_post_content'>
          <CKEditor
            editor={ClassicEditor}
            onChange={(event, editor) => {
              postData = editor.getData();
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

  let [title, setTitle] = useState(postData.title);
  let content = postData.content;

  // 발행 버튼 - 수정요청 함수
  const putPost = async () => {
    try {
      const response = await axios.request({
        method: 'put',
        url: '/board/put/' + serial,
        data: {
          postSerial: serial,
          title: title,
          content: content,
        },
      });
      const { error } = response.data;
      if (error) throw new Error(error);

      setBoardPage('home')

    } catch (error) {
      console.log(error);
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
  const { serial, stateFunctions } = props;
  const { setBoardPage, setPostNumber, setPostData } = props.stateFuncs

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
      if (error) throw new Error(error);
      if (result) setBoardPage('home');
    } catch (err) {
      alert(err);
    }
  };

  // 댓글 추가 요청 함수
  const addComment = async (reqContent, reply = 0) => {
    try {
      if (!reqContent) throw new Error('댓글을 입력해주세요')
      const response = await axios.request({
        method: 'post',
        url: '/comment',
        data: {
          serial: serial,
          content: reqContent,
          reply: reply,
        },
      });

      if (response.data.error) throw new Error(response.data.error);

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
      alert(err.message);
    }

  };

  // 댓글 삭제 요청 함수
  const delComment = async (comment_serial) => {
    try {
      const response = await axios.request({
        method: 'delete',
        url: '/comment/' + comment_serial,
        data: {
          boardSerial: serial
        }
      });

      if (response.data.result) {
        const { commentState } = response.data.result;

        const newCommentData = [...commentData];
        const index = newCommentData.findIndex((e) => {
          return e.comment_serial === comment_serial;
        })

        if (commentState === 'delete') newCommentData.splice(index, 1);
        else if (commentState === 'erase') newCommentData[index].erase = 1;
        else throw new Error('알 수 없는 에러입니다');

        const newState = new Array(newCommentData.length).fill({ type: 'reply', active: false })
        setReplyActive(newState);
        setCommentData(newCommentData);

      }
    } catch (error) {
      alert(error)
    }

  };

  // 댓글 수정 요청 함수
  const patchComment = async (reqContent, reqSerial) => {

    try {
      if (!reqContent) throw new Error('댓글을 입력해주세요')
      const response = await axios.request({
        method: 'patch',
        url: 'comment',
        data: {
          reqSerial,
          reqContent,
        },
      });

      const { result, error } = response?.data;
      if (!result || error) throw new Error('수정에 실패하였습니다.');

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
      alert(err)
    }
  };



  // 게시물 데이터 요청
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/board/' + serial);
        const { result, error } = response.data;
        if (!result) throw new Error(error);

        const { boardData, commentData, userData } = result;

        if (boardData.user_serial === userData.serial || userData.id === 'admin') setIsUserMatch(true);
        setUserData(userData);
        setBoardData(boardData);
        setCommentData(commentData);
        setPostData(boardData);

        const newState = new Array(commentData.length).fill({ type: 'reply', active: false });
        setReplyActive(newState);

      } catch (err) {
        console.log(err);
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
              // const newState = new Array(replyActive.length).fill({ type: 'patch', active: false });
              // setReplyActive(newState);
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
        dateKST.setHours(dateKST.getHours() + 9);
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
          reply_dateKST.setHours(reply_dateKST.getHours() + 9);
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
            <div className='button'><button onClick={() => {setBoardPage('home')}}>메인으로</button></div>
          </div>

          <div className='post-id'>
            {boardData.user_id}
          </div>

          <div className='post-urlUpdate'>
            <div className='post-url'>
              <a href={window.location.origin + '/board?serial=' + serial}>{window.location.origin + '/board?serial=' + serial}</a>
            </div>
            {
              isUserMatch ? (
                <div className='post-update'>
                  <button onClick={() => {
                    setPostNumber(serial);
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
  const { stateFuncs } = props;
  const { setBoardPage, setPostNumber, stateFunctions } = stateFuncs

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
    const { setPostNumber, setBoardPage } = props.stateFuncs;
    const { title, commentNumber, id, view, date } = props;
    const [created] = date.split("T");

    return (
      <tr onClick={() => {
        setPostNumber(props.serial);
        setBoardPage('read');
      }} className="board_tbody_tr">

        <td className="board_title">
          <span>{title}</span>
          <span className="board_comment"> ({commentNumber})</span>
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
        if (!response.data.result) throw new Error('에러');
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
      } catch (error) {
        console.error(error);
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
  const { stateFunctions, serial } = props
  const { setPageSerial } = stateFunctions;
  let initPage = 'home';
  if (serial) {
    initPage = 'read';
    setPageSerial(null)
  }


  const [boardPage, setBoardPage] = useState(initPage);
  const [postNumber, setPostNumber] = useState(serial);
  const [postData, setPostData] = useState(null);


  const stateFuncs = {
    setBoardPage,
    setPostNumber,
    setPostData,
  }
  if (boardPage === 'home') return <BoardHome stateFuncs={stateFuncs} />
  if (boardPage === 'read') return <BoardPostRead postData={postData} serial={postNumber} stateFuncs={stateFuncs} stateFunctions={stateFunctions}/>
  if (boardPage === 'create') return <BoardPostCreate stateFuncs={stateFuncs} stateFunctions={stateFunctions} />
  if (boardPage === 'update') return <BoardPostUpdate postData={postData} serial={postNumber} stateFuncs={stateFuncs} />
  return <Loading2 />
}

export { Board };