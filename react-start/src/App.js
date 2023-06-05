// eslint-disable-next-line
import { useState, useRef, useEffect } from 'react';

import './css/App.css';
import './css/animation.css';
import { LogInForm, RegisterForm } from './component/LogInForm'
import Nav from './component/Navbar'
import { Loading2 } from './component/Loading'
import { Board } from './component/BoardRouter'
import { Coin } from './component/CoinRouter'
import { Home } from './component/Test'
import axios from 'axios';

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
  const navList = ['userInfo', 'coinInfo'];

  const [profilePage, setProfilePage] = useState(0);
  const [profileData, setProfileData] = useState(null)
  const stateFuncs = {
    setProfilePage,
    setProfileData,
  }

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

  // 유저정보 페이지
  const UserInfo = (props) => {

    const changePassword = async (current, change, check) => {
      try {
        if (/google-\d+/.test(profileData.id)) throw new Error('구글 계정은 변경할 수 없습니다');
        if (change !== check) throw new Error('변경하려는 비밀번호와 재확인 비밀번호가 일치하지 않습니다');

        const response = await axios.request({
          method: 'patch',
          url: '/user/password',
          data: {
            current,
            change,
          }
        });

        if (response.data.error) throw new Error(response.data.error);

        if (response.data.result) {
          alert('새로운 비밀번호로 다시 로그인 해주세요')
          window.location.href = window.location.origin;
        }

      } catch (error) {
        alert(error.message);
      }
    }

    const withdraw = async () => {

      try {
        const response = await axios.delete('/user');
        console.log(response)
        if (response.data.error) throw new Error(response.data.error);
        if (response.data.result) {
          alert('탈퇴되었습니다');
          window.location.href = window.location.origin;
        }
      } catch (err) {
        alert(err);
      }
    }


    return profileData ? (
      <div className='page'>
        <div className='title'>
          <h3>회원정보</h3>
        </div>
        <div className='userinfo'>
          <div className='userinfo-id'>
            <h4>아이디</h4>
            <span>{profileData.id}</span>
          </div>

          <div className='userinfo-password'>
            <h4>비밀번호</h4>
            <form onSubmit={(e) => {
              e.preventDefault();
              changePassword(e.target.currentPW.value, e.target.changePW.value, e.target.checkPW.value);
            }}>
              <div>
                <input name='currentPW' type='password' placeholder='현재 비밀번호'></input>
              </div>
              <div>
                <input name='changePW' type='password' placeholder='변경할 비밀번호'></input>
              </div>
              <div>
                <input name='checkPW' type='password' placeholder='변경할 비밀번호 재입력'></input>
              </div>

              <div className='button'>
                <button>변경</button>
              </div>
            </form>

            <h4>탈퇴하기</h4>
            <form onSubmit={(e) => {
              e.preventDefault();
              withdraw();
            }}>
              <div className='button'>
                <button>탈퇴하기</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    ) : (
      <Loading2 />
    )
  }

  // 유저 코인 정보 페이지
  const CoinInfo = () => {

    const [asset, setAsset] = useState([]);
    const [ticker, setTicker] = useState([]);


    useEffect(() => {
      // 유저의 자산 정보를 가져오는 함수
      const getAssetData = async () => {
        try {
          const response = await axios.request({
            method: 'get',
            url: '/user/coin/all',
          });

          if (response.data.error) throw new Error(response.data.error);
          if (!response?.data?.result) throw new Error('데이터를 가져올 수 없습니다');

          const { data } = response.data.result;
          setAsset(data);
        } catch (err) {
          alert(err);
        }
      }

      // 코인 현재가 정보를 가져오는 함수
      const getTickerData = async () => {
        try {
          const response = await axios.request({
            method: 'get',
            url: '/coin/data',
          });

          // if (!response?.data) throw new Error('데이터를 가져올 수 없습니다1');
          const { ticker: resTicker } = response.data;

          setTicker(resTicker);

        } catch (err) {
          alert(err);
        }
      }

      // 자산 정보는 한번, 현재가는 1.5초마다 갱신
      getAssetData();
      const timer = setInterval(() => {
        getTickerData();
      }, 1500)

      return (() => {
        clearInterval(timer);
      });
    }, []);

    let totalBuyPrice = 0;
    let totalCurrentPrice = 0;
    let totalAsset = 0;
    const assetHTML = []
    // 자산 정보와 ticker 정보가 있을 경우에만 실행
    if (asset.length > 0 && ticker.length > 0) {
      asset.forEach((e, i) => {
        const { market, price, amount } = e;

        if (e.market === 'KRW') {
          totalAsset += amount;

          assetHTML.push(
            <tr key={i}>
              <td>원화</td>
              <td>-</td>
              <td>-</td>
              <td>{amount}</td>
              <td>-</td>
            </tr>
          )
        }

        // 자산 정보가 있으면
        if (e.amount > 0) {
          const index = ticker.findIndex(f => {
            return f.market === market;
          });

          const nowPrice = ticker[index].trade_price
          totalBuyPrice += price * amount;
          totalCurrentPrice += nowPrice * amount;
          totalAsset += nowPrice * amount;

          assetHTML.push(
            <tr key={i}>
              <td>{market}</td>
              <td>{amount}</td>
              <td>{price}</td>
              <td>{nowPrice}</td>
              <td>{parseInt((nowPrice - price) / price * 10000) / 100}</td>
            </tr>
          )
        }
      })
    }

    return ticker.length ? (
      asset ? (
        <div className='page'>
          <div className='title'>
            <h3>모의코인 자산 정보</h3>
          </div>
          <div className='asset'>
            <div className='total-asset'>
              <div>

              </div>
              <div className='divTable'>
                <div className='divTable-cell'>
                  <div className='divTable-row divTable-th'>총 매수금액</div>
                  <div className='divTable-row divTable-th'>총 평가금액</div>
                </div>
                <div className='divTable-cell'>
                  <div className='divTable-row'>{totalBuyPrice} \</div>
                  <div className='divTable-row'>{totalCurrentPrice} \</div>
                </div>
                <div className='divTable-cell'>
                  <div className='divTable-row divTable-th'>총 평가손익</div>
                  <div className='divTable-row divTable-th'>총 평가수익률</div>
                </div>
                <div className='divTable-cell'>
                  <div className='divTable-row'>{totalAsset} \</div>
                  <div className='divTable-row'>{
                    isNaN(parseInt((totalCurrentPrice - totalBuyPrice) / totalBuyPrice * 10000) / 100) ?
                      '-' :
                      parseInt((totalCurrentPrice - totalBuyPrice) / totalBuyPrice * 10000) / 100
                  } %
                  </div>
                </div>
              </div>

            </div>
            <div className='table'>
              <table>
                <thead>
                  <tr>
                    <th>코인명</th>
                    <th>보유수량</th>
                    <th>매수가</th>
                    <th>평단가</th>
                    <th>손익(%)</th>
                  </tr>
                </thead>
                <tbody>
                  {assetHTML}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) :
        <div>자산이 없습니다</div>
    ) :
      <Loading2 />
  }

  // 좌측 페이지 네이게이션 컴포넌트
  const PageList = (props) => {
    const { stateFuncs, navList } = props;
    const { setProfilePage } = stateFuncs;

    return (
      <div className='navigate'>
        <ul>
          <a onClick={() => { setProfilePage(0); }}><li>회원정보</li></a>
          <a onClick={() => { setProfilePage(1); }}><li>코인정보</li></a>
        </ul>
      </div>

    )
  }

  // 마이페이지 표시 컴포넌트
  const MyPageContent = (props) => {
    const { page } = props
    if (page === 1) return <CoinInfo />;

    return <UserInfo />;
  }

  return (
    <div className='content_box ani_fadeIn'>
      <div className='mypage'>
        <div className='title'>
          <h2>마이페이지</h2>
        </div>
        <div className='content'>
          <PageList navList={navList} stateFuncs={stateFuncs} />
          <MyPageContent page={profilePage} stateFuncs={stateFuncs} />
        </div>
      </div>

    </div>
  )

}

const Content = (props) => {
  const { page, serial, stateFunctions } = props;

  if (page === 1) return <Coin stateFunctions={stateFunctions} />
  if (page === 2) return <Board stateFunctions={stateFunctions} serial={serial} />
  if (page === 3) return <MyPage />

  return <Home />
};

const App = () => {
  const navBtnList = ['NyaongNyaooong', '모의코인거래', '자유게시판', 'mypage'];

  let nowPageState = 0;
  const urlPath = window.location.pathname;
  const comparePath = urlPath.split('/')
  navBtnList.forEach((e, i) => {
    if (comparePath[1] === e.toLowerCase()) nowPageState = i;
  });

  let [lgnFrmAct, setLgnFrmAct] = useState(false);
  let [regFrmAct, setRegFrmAct] = useState(false);
  let [bgDarkAct, setBgDarkAct] = useState(false);
  let [userData, setUserData] = useState(null);

  const [page, setPage] = useState(0);
  const [pageSerial, setPageSerial] = useState(null);
  const [refreshPage, setRefreshPage] = useState(0);
  // let [loading, setLoading] = useState(true);

  const stateFunctions = {
    setLgnFrmAct,
    setRegFrmAct,
    setBgDarkAct,
    setUserData,
    setPage,
    setPageSerial,
    setRefreshPage,
  };

  // 최초 랜더링 시 페이지 이동 및 로그인 정보 검증
  useEffect(() => {
    const url = new URL(window.location.href);
    const urlParams = url.searchParams;
    if (url.pathname === '/board') {
      if (urlParams.get('serial')) setPageSerial(urlParams.get('serial'));
      setPage(2);
    }

    const fetchData = async () => {
      const result = await axios.get('/user/verify');
      setUserData(result.data.result.id);
    }
    fetchData();
  }, []);

  console.log('render')
  // setTimeout(() => {
  //   setLoading(false);
  // }, 900);

  return userData ? (
    <div className='app'>
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

          <Content page={page} serial={pageSerial} refreshPage={refreshPage} stateFunctions={stateFunctions}></Content>

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

      <div className="footer">

      </div>
    </div>
  ) : (
    <Loading2 />
  );
}

export default App;


