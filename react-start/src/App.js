import { useState, useRef, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';

import './css/App.css';
import './css/animation.css';
import { LogInForm, RegisterForm } from './component/LogInForm'
import Nav from './component/Navbar'
// import Loading from './component/Loading'
import { Blog } from './component/BlogRouter'
import { Home, Board, BoardPostCreate, BoardPostRead, BoardPostUpdate } from './component/BoardRouter'
import { Coin } from './component/CoinRouter'
import axios from 'axios';



const BgDarker = (props) => {
  const { active, stateFuncs } = props;
  const { setBgDarkAct, setLgnFrmAct, setRegFrmAct } = stateFuncs;
  const divDark = useRef(null);

  // 검은 배경 클릭 했을 때
  const onClickFunction = () => {
    setBgDarkAct(false);
    setLgnFrmAct(false);
    setRegFrmAct(false);

    divDark.current.classList.replace("zhide", "ani_fadeOutDark");
    setTimeout(() => {
      divDark.current.classList.replace("ani_fadeOutDark", "zhide");
    }, 300);
  };

  if (active) return <div ref={divDark} id="fadeOut" className="ani_fadeInDark" onClick={onClickFunction}></div>
  else return <div ref={divDark} id="fadeOut" className="zhide" onClick={onClickFunction}></div>
}


const MyPage = (props) => {
  // 유저정보 요청

  return (
    <div className='mypage-app'>

      <div className='mypage-title'>
        <h3>회원정보</h3>
      </div>

      <div className='mypage-id'>
        <h4>아이디</h4>
        {/* 아이디 */}
      </div>

      <div className='mypage-password'>
        <h4>비밀번호</h4>
        <div>
          <input placeholder='현재 비밀번호'></input>
        </div>
        <div>
          <input placeholder='변경할 비밀번호'></input>
        </div>
        <div>
          <input placeholder='비밀번호 재입력'></input>
        </div>

        <div>
          <button>변경</button>
        </div>
      </div>

      <div className='mypage-coin'>
        <h4>모의코인 투자</h4>
        <span>잔액</span>
        <span>충전한 금액</span>
        <div>
          <button>100만원 충전하기</button>
        </div>
      </div>
    </div>
  );
}

const Content = (props) => {
  switch (props.page) {
    case 1:
      return <Blog />
    case 2:
      return <Board />
    case 3:
      return <Coin />
    case 5:
      return <MyPage />

    //   return <BoardPostCreate />
    // case 4:
    //   return <BoardPostRead />
    // case 5:
    //   return <BoardPostUpdate />
    // case 6:

    default:
      return <Home />
  };
};


function App() {
  const navBtnList = ['NyaongNyaooong', 'Blog', 'Board', 'Coin', 'menu2', 'mypage'];

  let nowPageState = 0;
  const urlPath = window.location.pathname;
  const comparePath = urlPath.split('/')
  navBtnList.forEach((e, i) => {
    if (comparePath[1] === e.toLowerCase()) nowPageState = i;
  });
  // axios.get("http://localhost:8080/userdata")
  // .then((response) => {
  //   console.log(response);
  // })
  // .catch((error) => {
  //   console.log("에러발생 : ", error)
  // });
  let [lgnFrmAct, setLgnFrmAct] = useState(false);
  let [regFrmAct, setRegFrmAct] = useState(false);
  let [bgDarkAct, setBgDarkAct] = useState(false);
  let [userData, setUserData] = useState(null);

  const [page, setPage] = useState(0);
  // let [loading, setLoading] = useState(true);

  const stateFunctions = {
    setLgnFrmAct,
    setRegFrmAct,
    setBgDarkAct,
    setUserData,
    setPage,
  };

  // 최초 랜더링 시 로그인 정보 검증
  useEffect(() => {
    async function fetchData() {
      const result = await axios.get('/userdata');
      setUserData(result.data);
    }
    fetchData();
  }, []);

  console.log('render')
  // setTimeout(() => {
  //   setLoading(false);
  // }, 900);

  return (
    <BrowserRouter basename={process.env.PUBLIC_URL}>
      {/* <Loading active={loading} /> */}

      {/* background shadow animation */}
      <BgDarker active={bgDarkAct} stateFuncs={stateFunctions}></BgDarker>
      {/* /background shadow animation */}

      {/* All Section */}
      <div className="container">
        {/* <!-- Left Section --> */}
        <div className="leftSection"></div>
        {/* <!-- /Left Section --> */}

        {/* <!-- Middle Section --> */}
        <div className="middleSection">

          {/* <!-- 네비게이션바 --> */}
          {!userData ? <div></div> : <Nav btnList={navBtnList} btnAct={page} stateFuncs={stateFunctions} userData={userData} />}
          
          {/* <!-- /네비게이션바 --> */}

          {/* <!-- Content --> */}
          <div className="content">
            <Content page={page}></Content>
          </div>
          {/* <!-- /Content --> */}

        </div>
        {/* <!-- /Middle Section --> */}

        {/* <!-- Right Section --> */}
        <div className="rightSection"></div>
        {/* <!-- /Right Section --> */}
      </div>
      {/* /All Section */}

      {/* <!-- Login & Register Form --> */}
      <LogInForm active={lgnFrmAct} stateFuncs={stateFunctions} />
      <RegisterForm active={regFrmAct} />
      {/* /Login & Register Form */}

      <div className="footer"></div>
    </BrowserRouter >
  );
}

export default App;
