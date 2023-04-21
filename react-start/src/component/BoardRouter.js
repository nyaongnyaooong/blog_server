import { Link, useParams, useNavigate } from 'react-router-dom';
import '../css/board.css'
import axios from 'axios';
import { useState, useEffect } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

// 메인 소개 페이지
const Home = () => {
  return (
    <div className="content_box visible ani_fadeIn" id="home">
      <p>
        Hello Blog
        {/* <!-- 안녕하세요
        현재 NodeJS를 사용하여 Back-End 개발 공부 중 입니다

        https://github.com/nyaongnyaooong
        https://career.programmers.co.kr/pr/luckyyou123_7068

        HTML CSS JavaScript NodeJS MongoDB MySQL --> */}

        {/* <!-- <svg width="32" height="32" aria-hidden="true" viewBox="0 0 16 16" version="1.1" data-view-component="true" className="octicon octicon-mark-github v-align-middle">
          <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
        </svg> --> */}

        {/* <!-- <path fill-rule="evenodd" clip-rule="evenodd" d="M10 10h60c5.523 0 10 4.477 10 10v60c0 5.523-4.477 10-10 10H10C4.477 90 0 85.523 0 80V20c0-5.523 4.477-10 10-10z" fill="#202B3D"></path> --> */}

      </p>
    </div>
  )
}

// 게시판 메인 페이지
const Board = () => {
  // 게시판 데이터 state
  const [boardData, setBoardData] = useState([]);

  // axios 요청으로 데이터를 받아 boardData state에 넣음
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/board/data");
        setBoardData(response.data);

      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, []);

  // 게시판 표 최상단 제목 컴포넌트
  function TableCellTitle(props) {
    function Td(props) {
      return (
        <td className={props.classTd}>
          <span>{props.desc}</span>
        </td>
      );
    }
    return (

      <tr className="boardListTitle">

        <td className="board_title" style={{ textAlign: "center" }}>
          <span>{props.desc1}</span>
        </td>
        <Td classTd="board_author" desc={props.desc2}></Td>
        <Td classTd="board_good" desc={props.desc3}></Td>
        <Td classTd="board_created" desc={props.desc4}></Td>
      </tr>
    );
  }

  //게시판 표 내용 컴포넌트
  function TableCell(props) {
    const titleLink = "/board/" + props.id;
    let [fullCreatedDate] = props.created.split("T");

    return (
      <tr className="boardListTitle">

        <td className="board_title">
          <Link to={titleLink}>
            <span>{props.title}</span>
          </Link>
          <span className="board_comment"> (0)</span>
        </td>
        <td className="board_author">
          <span>{props.author}</span>
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

  //게시판 데이터를 바탕으로 array 생성
  const array = [];
  boardData.forEach(e => {
    array.push(
      <TableCell key={e.id} id={e.id} title={e.title} author={e.author} view={e.view} created={e.created}></TableCell>
    );
  });

  return (
    <div className="content_box ani_fadeIn" id="board">
      <Link to={"/board/write"}>
        <span>글쓰기</span>
      </Link>
      <table className="boardTable">
        <tbody>
          <TableCellTitle desc1="제목" desc2="글쓴이" desc3="조회수" desc4="날짜"></TableCellTitle>
          {array}
        </tbody>
      </table>
      <Link to="/board?s=1"><div>다음페이지</div></Link>
    </div>
  );
}

// 게시판 새로운 글 포스팅 페이지
const BoardPostCreate = () => {
  const navigate = useNavigate();
  let title = '';
  let postData = '';

  //발행 함수
  const postBoard = async () => {
    console.log(title, postData)
    try {
      const response = await axios.post('/board/post',
        {
          title: title,
          content: postData,
        }
      );
      const { result, error } = response.data;
      if (result) navigate('/board');
      else throw new Error(error);
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className="content_box ani_fadeIn" id="board">
      <form>
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
        <div className='board_post_complete'><button onClick={postBoard}>발행</button></div>
      </form>
    </div>
  )
}

//게시글 수정 페이지
const BoardPostUpdate = () => {
  const { id } = useParams();
  const navigate = useNavigate();


  let [postData, setPostData] = useState(null);
  let [isUserMatch, setIsUserMatch] = useState(false);
  let [title, setTitle] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/board/' + id);
        const { result, error } = response.data;
        if (!result) throw new Error(error);

        const { sqlData, userData } = result;

        if (sqlData.author === userData.userid || userData.userid === 'admin') setIsUserMatch(true);
        setPostData(sqlData);
        setTitle(sqlData.title);


      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, [id])

  // 발행 버튼 - 수정요청 함수
  const putPost = async () => {
    try {
      const response = await axios.put('/board/put/' + id,
        {
          title: title,
          content: postData.content,
        }
      );

      const { result, error } = response.data;
      if (result) {
        navigate('/board');
      }
      else throw new Error(error);
    } catch (error) {
      console.log(error);
    }
  }

  if (isUserMatch) {
    return (
      <div className="content_box ani_fadeIn" id="board">
        <form>
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
                console.log(postData.content)
                postData.content = editor.getData();
              }}
            />
          </div>
          <div className='board_post_complete'><button onClick={putPost}>발행</button></div>
        </form>
      </div>
    )
  }
  return;
}

// 게시판 글 읽는 페이지
const BoardPostRead = () => {
  //router의 querystring /board/:id
  const { id } = useParams();
  const navigate = useNavigate();

  let [boardData, setBoardData] = useState(null);
  let [isUserMatch, setIsUserMatch] = useState(false);

  //삭제 버튼 누르면 삭제 요청하는 함수
  const deletePost = () => {
    const fetchData = async () => {
      try {
        const response = await axios.delete('/board/delete/' + id);
        const { result, error } = response.data;
        if (result) navigate('/board');
        else throw new Error(error);
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  };

  //수정 버튼 누름
  const putBoard = () => {
    navigate('/board/put/' + id)
  };

  // 게시물 데이터 get
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/board/' + id);
        const { result, error } = response.data;
        if (!result) throw new Error(error);

        const { sqlData, userData } = result;

        if (sqlData.author === userData.userid || userData.userid === 'admin') setIsUserMatch(true);
        setBoardData(sqlData);
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, [id]);

  if (isUserMatch) {
    return (
      <div className='content_box'>
        <button onClick={deletePost}>삭제</button>
        <button onClick={putBoard}>수정</button>
        <div>{boardData.title}</div>

        {/* <div>{content}</div> */}
        <div dangerouslySetInnerHTML={{ __html: boardData.content }}></div>
      </div>
    );
  }

  if (boardData) {
    return (
      <div className='content_box'>
        <div>{boardData.title}</div>
        {/* <div>{content}</div> */}
        <div dangerouslySetInnerHTML={{ __html: boardData.content }}></div>
      </div>
    );
  }

  return;
}

export { Home, Board, BoardPostCreate, BoardPostRead, BoardPostUpdate };