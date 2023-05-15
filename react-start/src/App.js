import { useState, useRef, useEffect } from 'react';

import './css/App.css';
import './css/animation.css';
import { LogInForm, RegisterForm } from './component/LogInForm'
import Nav from './component/Navbar'
import { Loading2 } from './component/Loading'
import { Blog } from './component/BlogRouter'
import { Board } from './component/BoardRouter'
import { Coin } from './component/CoinRouter'
import axios from 'axios';

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

// 백그라운드 어둡게
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

// 마이페이지
const MyPage = (props) => {
  const [profileData, setProfileData] = useState(null)

  // 유저정보 요청
  useEffect(() => {
    const fetchData = async () => {
      const response = await axios.request({
        method: 'get',
        url: '/user/profile'
      })
      if (response.data.result) setProfileData(response.data.result);
    }
    fetchData();
  }, [])

  const chargeMoney = () => {
    const fetchData = async () => {
      const response = await axios.request({
        method: 'post',
        url: '/user/charge',
      });
      console.log(response)

      if (response.data.result) {
        const newProfile = { ...profileData };
        newProfile.money = newProfile.money + 1000000;
        newProfile.charge = newProfile.charge + 1;
        setProfileData(newProfile);
      }
    }
    fetchData();
  }

  return profileData ? (
    <div className='mypage-app'>

      <div className='mypage-title'>
        <h3>회원정보</h3>
      </div>

      <div className='mypage-id'>
        <h4>아이디</h4>
        {profileData.id}
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
        {profileData.money}
        <span>충전한 금액</span>
        {profileData.charge}
        <div>
          <button onClick={chargeMoney}>100만원 충전하기</button>
        </div>
      </div>
    </div>
  ) : (
    <Loading2></Loading2>
  );
}

const Content = (props) => {
  const { page, stateFunctions } = props;

  switch (page) {
    case 1:
      return <Blog />
    case 2:
      return <Board stateFunctions={stateFunctions} />
    case 3:
      return <Coin stateFunctions={stateFunctions} />
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
      const result = await axios.get('/user/verify');
      setUserData(result.data);
      console.log(result.data);
    }
    fetchData();
  }, []);

  console.log('render')
  // setTimeout(() => {
  //   setLoading(false);
  // }, 900);

  return userData ? (
    <div>
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
          <Nav btnList={navBtnList} btnAct={page} stateFuncs={stateFunctions} userData={userData} />

          {/* <!-- /네비게이션바 --> */}

          {/* <!-- Content --> */}
          <div className="content">
            <Content page={page} stateFunctions={stateFunctions}></Content>
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
    </div>
  ) : (
    <Loading2 />
  );
}

export default App;
