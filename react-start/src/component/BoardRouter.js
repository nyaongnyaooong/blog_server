// eslint-disable-next-line

import '../css/board.css'
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
    console.log(title, postData);
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

    } catch (error) {
      if (error.message === '01') {
        alert('로그인해주세요');
        setLgnFrmAct(true);
        setBgDarkAct(true);
      }
      else alert('알 수 없는 오류입니다');
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
  console.log(postData);

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
  const { serial } = props;
  const { setBoardPage, setPostNumber, setPostData } = props.stateFuncs

  const [boardData, setBoardData] = useState(null);
  const [commentData, setCommentData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [replyActive, setReplyActive] = useState([]);
  const [putReplyActive, setPutReplyActive] = useState([]);

  const [isUserMatch, setIsUserMatch] = useState(false);

  // 삭제 요청 함수
  const deletePost = async () => {

    try {
      const response = await axios.delete('/board/delete/' + serial);
      const { result, error } = response.data;
      if (error) throw new Error(error)
      if (result) setBoardPage('home');
    } catch (error) {
      console.log(error);
    }
  };

  // 댓글 추가 요청 함수
  const addComment = async (content, reply = 0) => {
    try {
      const response = await axios.request({
        method: 'post',
        url: '/comment/add',
        data: {
          serial: serial,
          content: content,
          reply: reply,
        },
      });
      if (response.data.result) {
        console.log(commentData)
        const { sqlData, userData } = response.data.result;
        const newCommentData = [...commentData];
        newCommentData.push({
          comment_serial: sqlData.insertId,
          user_serial: userData.serial,
          user_id: userData.id,
          board_serial: serial,
          content: content,
          date: '방금 전',
          reply: reply
        })
        setCommentData(newCommentData);
      }


    } catch (error) {
      console.log(error);
    }

  };

  // 댓글 삭제 요청 함수
  const delComment = async (comment_serial) => {
    try {
      const response = await axios.request({
        method: 'delete',
        url: '/comment/delete/' + comment_serial,
      });
      if (response.data.result) {
        const newCommentData = [...commentData];
        const index = newCommentData.findIndex((e) => {
          return e.comment_serial === comment_serial;
        })
        newCommentData.splice(index, 1)

        setCommentData(newCommentData);
      }


    } catch (error) {
      console.log(error);
    }

  };

  // 댓글 수정 요청 함수
  const putComment = async (content, serial) => {
    try {
      const response = await axios.request({
        method: 'put',
        url: 'comment/put',
        data: {
          serial,
          content,
        },
      });
      console.log(response)
      setPutReplyActive()

    } catch (error) {
      console.log(putComment())
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
        console.log(result)

        if (boardData.user_serial === userData.serial || userData.id === 'admin') setIsUserMatch(true);
        setUserData(userData);
        setBoardData(boardData);
        setCommentData(commentData);
        setPostData(boardData);

        const initReplyActive = new Array(commentData.length).fill(false);
        setReplyActive(initReplyActive);
        putReplyActive(initReplyActive);
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, [serial]);

  if (boardData && commentData && userData) {

    // 이하 댓글 리스트 작성

    // 댓글데이터를 댓글과 대댓글로 분리
    const arrComment = [];
    const arrReply = [];
    commentData.forEach((e, i) => {
      if (e.reply) arrReply.push(e);
      else arrComment.push(e);
    });
    console.log(commentData);

    // 댓글 리스트 html 작성
    const commentList = arrComment.map((e, i) => {
      const { comment_serial, user_serial, user_id, content, date } = e;
      // mysql의 UTC 를 KST로 변환

      let dateKST_String;
      if (date === '방금 전') {
        dateKST_String = date;
      } else {
        const dateKST = new Date(date)
        dateKST.setHours(dateKST.getHours() + 9);
        dateKST_String = dateKST.toLocaleString();
      }


      // 각 댓글에 대댓글이 있는지 확인하여 대댓글 html작성
      const replyList = arrReply.map((f, j) => {
        const { reply } = f;

        // mysql의 UTC 를 KST로 변환
        let reply_dateKST_String;
        if (date === '방금 전') {
          reply_dateKST_String = f.date;
        } else {
          const reply_dateKST = new Date(f.date)
          reply_dateKST.setHours(reply_dateKST.getHours() + 9);
          reply_dateKST_String = reply_dateKST.toLocaleString();
        }

        if (reply === comment_serial) {
          return (
            <div key={j} className='comment-reply-item'>
              <div className='blank'></div>
              <div className='comment-reply-item-content'>
                <div className='comment-item-user'>
                  <span>{f.user_id}</span>
                </div>
                <div className='comment-item-content'>
                  <span>{f.content}</span>
                </div>
                <div className='comment-item-etc'>
                  <div className='comment-item-time'>
                    <div>
                      <span>{reply_dateKST_String}</span>
                    </div>
                  </div>
                  {
                    userData.serial === f.user_serial ? (
                      <div className='comment-item-button'>
                        {/* <button onClick={() => {
                          setPutReplyActive([comment_serial])
                        }}>수정</button> */}

                        <button onClick={async () => {
                          delComment(comment_serial);
                        }}>삭제</button>

                      </div>
                    ) : (
                      <div className='comment-item-button'>
                      </div>
                    )
                  }
                </div>
              </div>
            </div>
          )
        }
      })

      return (
        <div key={i} className='comment-item'>
          <div className='comment-item-user'>
            <span>{user_id}</span>
          </div>
          <div className='comment-item-content'>
            <span>{content}</span>
          </div>
          <div className='comment-item-etc'>
            <div className='comment-item-time'>
              <span>{dateKST_String}</span>
            </div>
            {
              // 댓글 주인과 로그인 유저가 같으면 수정 삭제버튼 추가
              userData.serial === user_serial ? (
                <div className='comment-item-button'>
                  {/* <button onClick={() => {
                    setPutReplyActive([comment_serial])
                  }}>수정</button> */}

                  <button onClick={() => {
                    delComment(comment_serial);
                  }}>삭제</button>

                  <button onClick={() => {
                    const newReplyActive = new Array(replyActive.length).fill(false);
                    if (!replyActive[i]) newReplyActive[i] = true;

                    setReplyActive(newReplyActive);
                  }}>답글</button>
                </div>
              ) : (
                <div className='comment-item-button'>
                  <button onClick={() => {
                    const newReplyActive = new Array(replyActive.length).fill(false);
                    if (!replyActive[i]) newReplyActive[i] = true;

                    setReplyActive(newReplyActive);
                  }}>답글</button>
                </div>
              )
            }
          </div>
          {
            // 답글 버튼을 눌렀을 때 textarea 표시
            replyActive[i] ? (
              <div className='comment-reply-write'>
                <div className='blank'></div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  console.log(comment_serial)
                  addComment(e.target.comment_content.value, comment_serial);
                }}>
                  <div className='comment-reply-text'>
                    <textarea name='comment_content' />
                  </div>

                  <div className='comment-button'>
                    <button type='submit'>등록</button>
                  </div>
                </form>
              </div>
            ) : (<div style={{ display: 'hidden' }} />)
          }
          {/* 대댓글이 있으면 표시 */}
          <div className='comment-reply-List'>
            {replyList}
          </div>
        </div>
      );
    });



    return (
      <div className='content_box ani_fadeIn'>
        <div className='post-head'>
          <h2 className='post-header'>
            자유 게시판
          </h2>

          <div className='post-title'>
            <h3>
              {boardData.title}
            </h3>
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
  const { setBoardPage, setPostNumber } = stateFuncs

  // 게시물 리스트
  const [postList, setPostList] = useState([]);
  const [userData, setUserData] = useState({});

  // 게시판 표 최상단 제목 컴포넌트
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

  //게시판 표 내용 컴포넌트
  const TableCell = (props) => {
    const { setPostNumber, setBoardPage } = props.stateFuncs;
    let [fullCreatedDate] = props.date.split("T");

    return (
      <tr onClick={(event) => {
        // event.preventDefault();
        setPostNumber(props.serial);
        setBoardPage('read');
      }} className="board_tbody_tr">

        <td className="board_title">

          <span>{props.title}</span>

          <span className="board_comment"> (0)</span>
        </td>
        <td className="board_author">
          <span>{props.id}</span>
        </td>
        <td className="board_view">
          <span>{props.view}</span>
        </td>
        <td className="board_created">
          <span>{fullCreatedDate}</span>
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
        console.log(response.data)
        setUserData(userData);

        const postArray = [];
        sqlData.forEach((e, i) => {
          postArray.push(
            <TableCell key={i} stateFuncs={stateFuncs} serial={e.board_serial} title={e.title} id={e.user_id} view={e.view} date={e.date} />
          );
        });
        setPostList(postArray);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, []);


  return postList.length ? (
    <div className="content_box board-main ani_fadeIn">
      <h2>자유 게시판</h2>

      <div className='button'>
        <button onClick={() => { setBoardPage('create'); }}>글쓰기</button>
      </div>

      <table className="board_table">
        <TableCellTitle desc1="제목" desc2="글쓴이" desc3="조회수" desc4="날짜"></TableCellTitle>
        <tbody>
          {postList}
        </tbody>
      </table>
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
  console.log(serial)
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
  if (boardPage === 'read') return <BoardPostRead postData={postData} serial={postNumber} stateFuncs={stateFuncs} />
  if (boardPage === 'create') return <BoardPostCreate stateFuncs={stateFuncs} stateFunctions={stateFunctions} />
  if (boardPage === 'update') return <BoardPostUpdate postData={postData} serial={postNumber} stateFuncs={stateFuncs} />
  return <Loading2 />
}


export { Board };