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

  let [boardData, setBoardData] = useState(null);
  let [commentData, setCommentData] = useState(null);
  let [isUserMatch, setIsUserMatch] = useState(false);

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

  // 댓글 요청 함수
  const addComment = async (content) => {
    try {
      const response = await axios.request({
        method: 'post',
        url: '/comment/add',
        data: {
          content: content,
        },
      });
    } catch (error) {
      console.log(error);
    }

  }

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
        setBoardData(boardData);
        setCommentData(commentData);
        setPostData(boardData);
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, [serial]);

  if (boardData) {
    return (
      <div className='content_box'>
        {
          isUserMatch ? (
            <div className='post-update'>
              <button onClick={() => {
                deletePost();
              }}>삭제</button>
              <button onClick={() => {
                setPostNumber(serial);
                setBoardPage('update');
              }}>수정</button>
            </div>
          ) : (
            <div />
          )
        }

        <div className='post-head'>
          <div className='post-header'>
            자유 게시판
          </div>

          <div className='post-title'>
            <h3>
              {boardData.title}
            </h3>
          </div>

          <div className='post-id'>
            {boardData.id}
          </div>
          <div className='post-url'>
            http://www.dsfsklf
          </div>
        </div>

        <div className='post-body'>
          <div className='post-content'>
            <div dangerouslySetInnerHTML={{ __html: boardData.content }}>
            </div>
          </div>
        </div>

        <div className='comment'>
          <form onSubmit={(e) => {
            e.preventDefault();
            addComment(e.target.comment_content.value);
          }}>
            <div className='comment-list'>

            </div>
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
        const postArray = [];
        response.data.result.forEach((e, i) => {
          postArray.push(
            <TableCell key={i} stateFuncs={stateFuncs} serial={e.board_serial} title={e.title} id={e.id} view={e.view} date={e.date} />
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
    <div className="content_box ani_fadeIn" id="board">

      <button onClick={() => { setBoardPage('create'); }}>글쓰기</button>

      <table className="board_table">
        <TableCellTitle desc1="제목" desc2="글쓴이" desc3="조회수" desc4="날짜"></TableCellTitle>
        <tbody>
          {postList}
        </tbody>
      </table>
      <div>다음페이지</div>
    </div>
  ) : (
    <Loading2 />
  )
}

// 게시판 메인 컴포넌트
const Board = (props) => {
  const { stateFunctions } = props
  const [boardPage, setBoardPage] = useState('home');
  const [postNumber, setPostNumber] = useState(null);
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