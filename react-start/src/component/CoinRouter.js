import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loading2 } from './Loading';
import ReactApexChart from "react-apexcharts";

class CustomError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CustomError';
  }
}

// 메인페이지 컴포넌트
const MainPage = (props) => {
  const { stateFuncs } = props;
  const { setCoinPage, setMarketName } = stateFuncs;

  const [ticker, setTicker] = useState(null);
  const [sortType, setSortType] = useState(null);

  // 코인데이터 주기적으로 받아옴
  useEffect(() => {
    let interval;
    const fetchData = async () => {
      try {
        const resMarket = await axios.request({
          method: 'get',
          url: "https://api.upbit.com/v1/market/all?isDetails=false",
          headers: {
            accept: "application/json"
          }
        });

        const krwMarket = [];
        let krwMrkStr = '';
        resMarket.data.forEach(e => {
          if (e.market.includes('KRW')) {
            krwMrkStr += krwMrkStr ? ', ' + e.market : e.market;
            krwMarket.push(e);
          }
        });

        interval = setInterval(async () => {
          try {
            const response = await axios.request({
              method: 'get',
              url: "https://api.upbit.com/v1/ticker?markets=" + krwMrkStr,
              headers: {
                accept: "application/json"
              }
            });
            const resTicker = response.data;

            resTicker.forEach((e, i) => {
              e.korean_name = krwMarket[i].korean_name;
            })
            setTicker(resTicker)
          } catch (err) {

          }
        }, 1000)

      } catch (err) {
        return false;
      }
    }
    fetchData();

    return () => {
      clearInterval(interval);
    };
  }, [])

  // thead 컴포넌트
  const CoinTableHead = () => {
    return (
      <thead>
        <tr>
          <th>순번</th>
          <th onClick={() => {
            if (sortType === 'marketUp') setSortType('marketDown');
            else setSortType('marketUp');
          }}>종목</th>
          <th onClick={() => {
            if (sortType === 'codeUp') setSortType('codeDown');
            else setSortType('codeUp');
          }}>기호</th>
          <th onClick={() => {
            if (sortType === 'priceUp') setSortType('priceDown');
            else setSortType('priceUp');
          }}>현재가</th>
          <th onClick={() => {
            if (sortType === 'displacementUp') setSortType('displacementDown');
            else setSortType('displacementUp');
          }}>전일대비</th>
          <th onClick={() => {
            if (sortType === 'accUp') setSortType('accDown');
            else setSortType('accUp');
          }}>거래대금(24H)</th>
        </tr>
      </thead>
    )
  }

  // tbody 컴포넌트
  const CoinTableBody = (props) => {
    const { data } = props;

    // const Href = (props) => {
    //   const { page, children } = props

    //   return (
    //     <span onClick={() => {
    //       setCoinPage(page);
    //       setMarketName(children);
    //     }}>
    //       {children}
    //     </span>
    //   )
    // }

    if (sortType === 'marketUp') {
      data.sort((a, b) => {
        if (a.korean_name < b.korean_name) return -1;
        if (a.korean_name > b.korean_name) return 1;
        return 0;
      });
    }
    if (sortType === 'marketDown') {
      data.sort((b, a) => {
        if (a.korean_name < b.korean_name) return -1;
        if (a.korean_name > b.korean_name) return 1;
        return 0;
      });
    }
    if (sortType === 'codeUp') {
      data.sort((a, b) => {
        if (a.market < b.market) return -1;
        if (a.market > b.market) return 1;
        return 0;
      });
    }
    if (sortType === 'codeDown') {
      data.sort((b, a) => {
        if (a.market < b.market) return -1;
        if (a.market > b.market) return 1;
        return 0;
      });
    }
    if (sortType === 'priceUp') {
      data.sort((a, b) => {
        return a.trade_price - b.trade_price;
      });
    }
    if (sortType === 'priceDown') {
      data.sort((b, a) => {
        return a.trade_price - b.trade_price;
      });
    }
    if (sortType === 'displacementUp') {
      data.sort((a, b) => {
        return (a.trade_price - a.opening_price) / a.opening_price - (b.trade_price - b.opening_price) / b.opening_price;
      });
    }
    if (sortType === 'displacementDown') {
      data.sort((b, a) => {
        return (a.trade_price - a.opening_price) / a.opening_price - (b.trade_price - b.opening_price) / b.opening_price;
      });
    }
    if (sortType === 'accUp') {
      data.sort((a, b) => {
        return a.acc_trade_price_24h - b.acc_trade_price_24h;
      });
    }
    if (sortType === 'accDown') {
      data.sort((b, a) => {
        return a.acc_trade_price_24h - b.acc_trade_price_24h;
      });
    }

    const array = [];
    data.forEach((elm, idx) => {
      let classColor;
      if (elm.trade_price > elm.opening_price) classColor = 'colorRed';
      else if (elm.trade_price < elm.opening_price) classColor = 'colorBlue';
      else classColor = 'colorWhite';

      array.push(
        <tr key={idx} onClick={() => {
          setCoinPage(elm.market);
          setMarketName(elm.korean_name);
        }}>
          {/* 순번 */}
          <td className='alignCenter'>{idx + 1}</td>
          {/* 종목 */}
          <td className='alignCenter'><span>{elm.korean_name}</span></td>
          {/* 기호 */}
          <td className='alignCenter'><span>{elm.market}</span></td>
          {/* 현재가 */}
          <td className='alignCenter'>{elm.trade_price.toLocaleString('ko-KR')}</td>
          {/* 전일대비 */}
          <td className={'alignCenter ' + classColor}>
            {Math.floor(10000 * (elm.trade_price - elm.opening_price) / elm.opening_price) / 100}
            %
          </td>
          {/* 거래대금 */}
          <td className='alignCenter'>
            {(Math.floor(elm.acc_trade_price_24h / 10000) / 100).toLocaleString('ko-KR')}
            M
          </td>
        </tr>
      )
    });
    // setTdArray([...array]);


    return (
      <tbody>
        {array}
      </tbody>
    );
  }

  //ticker 값이 들어오지않으면 Loading표시 
  return ticker ? (
    <div className="content_box content-coin ani_fadeIn">
      <div className='content-title'>
        <h2>암호화폐 모의투자</h2>
      </div>
      <div className='coin-table'>
        <table className='table alignCenter'>
          <CoinTableHead data={ticker} />
          <CoinTableBody data={ticker} />
        </table>
      </div>
    </div>
  ) : <Loading2 />;
};

// 코인 디테일 페이지
const DetailPage = (props) => {
  // coin: 어떤 코인의 디테일을 표시할 것인가?
  // stateFuncs: 뒤로 돌아가기용
  const currentMarketCode = props.coin;

  const { marketName, stateFuncs, refresh, appSetStates, userData } = props;
  const { setCoinPage, setAutoRefresh } = stateFuncs;
  const { setLgnFrmAct, setBgDarkAct, setServerDown, setUserData } = appSetStates;

  const [series, setSeries] = useState(null);
  const [options, setOptions] = useState(null);
  const [ticker, setTicker] = useState(null);
  const [coolTime, setCoolTime] = useState(false);

  const [userCoinData, setUserCoinData] = useState({});
  const [userTradeHistory, setUserTradeHistory] = useState([]);

  const [inputs, setInputs] = useState({
    buyAmount: '',
    sellAmount: '',
  });

  // 현재 코인 페이지 타이틀
  const Title = (props) => {
    const { data } = props;
    const { opening_price, trade_price } = data;

    let priceTag = null;
    if (data.trade_price === data.opening_price) {
      <span>{data.trade_price.toLocaleString('ko-KR')} (+0%)</span>
    } else {
      priceTag = data.trade_price > data.opening_price ?
        <span className='colorRed'>
          {data.trade_price.toLocaleString('ko-KR')} (+{Math.floor((trade_price - opening_price) / opening_price * 10000) / 100}%)
        </span> :
        <span className='colorBlue'>
          {data.trade_price.toLocaleString('ko-KR')} ({Math.floor((trade_price - opening_price) / opening_price * 10000) / 100}%)
        </span>;
    }

    return (
      <div>
        <span>
          {'[' + currentMarketCode + '] ' + marketName + ' '}
        </span>
        {priceTag}
      </div>
    );
  }


  //유저의 코인 정보를 불러옴
  const getUserCoinData = async () => {
    try {
      const response = await axios.request({
        method: 'get',
        url: '/user/coin',
        params: {
          market: currentMarketCode,
        }
      });

      if (response.data.result) {
        const { coin: userAsset, history } = response.data.result;

        const marketAssetIdx = userAsset.findIndex((e) => {
          return e.market === currentMarketCode;
        })
        const marketAsset = userAsset[marketAssetIdx];

        const newState = marketAsset ?
          { amount: marketAsset.amount, price: marketAsset.price } :
          { amount: 0, price: 0 }

        setUserCoinData(newState);
        setUserTradeHistory(history);
      }
    } catch (err) {

    }
  }


  // 캔들 데이터 get 후 그래프 그려냄 > 1초마다 반복
  useEffect(() => {
    getUserCoinData();

    const fetchData = async (count) => {
      try {
        // 캔들데이터
        let response = await axios.request({
          method: 'get',
          url: 'https://api.upbit.com/v1/candles/minutes/1?market=' + currentMarketCode + '&count=' + count
        });
        const candle = response.data;
        const dataArray = [];

        for (let i = candle.length - 1; i >= 0; i--) {
          const elm = candle[i];
          const dataObject = {
            x: Date.parse(elm.candle_date_time_kst + 'Z'),
            y: [
              elm.opening_price,
              elm.high_price,
              elm.low_price,
              elm.trade_price
            ]
          }
          dataArray.push(dataObject);
        }

        // ticker 데이터
        response = await axios.request({
          method: 'get',
          url: 'https://api.upbit.com/v1/ticker?markets=' + currentMarketCode
        });
        const [tickerData] = response.data;
        setTicker(tickerData)

        const tickerObject = {
          x: Date.parse(tickerData.candle_date_time_kst + 'Z'),
          y: [
            tickerData.opening_price,
            tickerData.high_price,
            tickerData.low_price,
            tickerData.trade_price
          ],
        }
        dataArray.push(tickerObject);
        const _series = [{ data: dataArray }];
        setSeries(_series);

        // 차트 옵션
        const options = {
          theme: {
            mode: "dark",
          },
          chart: {
            type: 'candlestick',
            animations: {
              enabled: false,
              easing: 'linear',
              speed: 1300,
            },
            height: 350,
          },
          title: {
            align: 'left'
          },
          xaxis: {
            type: 'datetime',
          },
          yaxis: {
            tooltip: {
              enabled: true
            }
          },
          plotOptions: {
            candlestick: {
              colors: {
                upward: '#C84A31',
                downward: '#1261C4'
              }
            }
          }
        }
        setOptions(options);
      } catch (err) {
        if (err instanceof CustomError) alert(err.message)
        else {
          if (err.message === 'Request failed with status code 500') setServerDown(true)
          else {
            let errorMessage = '알 수 없는 에러입니다'
            if (err.response.data.error) errorMessage = err.response.data.error;
            alert(errorMessage)
            window.location.href = '/'
          }
        }
      }
    }

    let timer;
    if (refresh) {
      timer = setInterval(async () => {
        await fetchData(49);
      }, 1500);
    } else {
      fetchData(49);
    }

    return () => {
      clearInterval(timer);
    };

  }, [currentMarketCode, refresh]);


  // 코인 거래 요청 함수
  const reqTrade = async (event, tradeType) => {
    event.preventDefault();

    try {
      if (userData.id === 'anonymous') throw new CustomError('로그인 정보가 없습니다');
      if (coolTime) throw new CustomError('연속으로 요청할 수 없습니다.');
      setInputs({ buyAmount: '', sellAmount: '' });
      setCoolTime(true);

      let inputValue;
      if (tradeType === 'buy') inputValue = event.target.buyAmount.value;
      if (tradeType === 'sell') inputValue = event.target.sellAmount.value;
      if (inputValue === '') throw new CustomError('수량을 입력해주세요');
      if (!(/^[0-9]*$/.test(inputValue))) throw new CustomError('숫자만 입력해주세요');

      inputValue = Number(inputValue);
      if (isNaN(inputValue)) throw new CustomError('숫자만 입력해주세요');
      if (inputValue <= 0) throw new CustomError('0보다 큰 숫자를 입력해 주세요');

      const response = await axios.request({
        method: 'post',
        url: '/user/coin/trade',
        data: {
          request: tradeType,
          market: currentMarketCode,
          amount: inputValue,
        },
      });

      getUserCoinData();
    } catch (err) {
      let errorMessage = '알 수 없는 에러입니다'

      if (err instanceof CustomError) errorMessage = err.message;
      else if (err?.response?.data.error) errorMessage = err.response.data.error;
      else if (err.message === 'Request failed with status code 500') setServerDown(true)

      alert(errorMessage);
      if (errorMessage === '로그인 정보가 없습니다') {
        setLgnFrmAct(true);
        setBgDarkAct(true);
      }
      if (!(err instanceof CustomError)) window.location.href = '/';

    } finally {
      setCoolTime(false);
    }
  }

  // 코인 히스토리 컴포넌트
  const History = () => {
    const THead = () => {
      return (
        <thead>
          <tr>
            <th className='width40'>순번</th>
            <th className='width40'>거래종류</th>
            <th className='width200'>거래량</th>
            <th className='width100'>거래가격</th>
            <th className='width100'>총 거래금액</th>
            <th className='width100'>거래시간</th>
          </tr>
        </thead>
      )
    }

    const TBody = () => {
      const Tr = () => {
        return userTradeHistory.map((e, i) => {
          const dateKST = new Date(e.date);
          dateKST.setHours(dateKST.getHours() + 9);
          const dateKST_String = dateKST.toLocaleString();

          return (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{e.trading ? '구매' : '판매'}</td>
              <td>{e.amount.toLocaleString('ko-KR')}</td>
              <td>{e.price.toLocaleString('ko-KR')}</td>
              <td>{(e.amount * e.price).toLocaleString('ko-KR')}</td>
              <td>{dateKST_String}</td>
            </tr>
          )
        })
      }

      return (
        <tbody>
          <Tr />
        </tbody>
      )
    }

    return (
      <table>
        <THead />
        <TBody />
      </table>
    );
  }

  return series && options && ticker ? (
    <div className='content_box coin-datail'>

      {/* 타이틀영역 */}
      <div className='coin-title'>
        <div className='text-area'>
          <Title data={ticker}></Title>
        </div>
        <div className='button-area'>
          <div>
            <button onClick={() => {
              setAutoRefresh(!refresh);
            }}>
              {
                refresh ? '자동 업데이트 일시정지' : '자동 업데이트 재시작'
              }
            </button>
            <button onClick={() => { setCoinPage('home') }}>메인으로</button>
          </div>
        </div>
      </div>

      {/* 차트영역 */}
      <div id="coin-chart">
        <ReactApexChart options={options} series={series} type="candlestick" height={300} width={'100%'} />
      </div>

      {/* 모의 거래 요청 영역 */}
      <div className='trade'>
        <div className='trade-type'>
          <form onSubmit={(e) => reqTrade(e, 'buy')}>
            <div className='desc-area'>
              <div className='text-area'>
                <span>보유 수량</span>
              </div>
              <div className='input-area'>
                <span>{userCoinData.amount}</span>
              </div>
            </div>
            <div className='desc-area'>
              <div className='text-area'>
                <span>평단가</span>
              </div>
              <div className='input-area'>
                <span>{userCoinData.price ? userCoinData.price.toLocaleString('ko-KR') : 0}</span>
              </div>
            </div>
            <div className='desc-area'>
              <div className='text-area'>
                <span>구매 수량</span>
              </div>
              <div className='input-area'>
                <input name='buyAmount' onChange={(event) => {
                  const newInputs = { ...inputs }
                  newInputs.buyAmount = event.target.value
                  setInputs(newInputs);
                }} value={inputs.buyAmount} />
              </div>
            </div>
            <div className='button-area'>
              <button type='submit' className='bgColorRed' name='reqBuy'>구매하기</button>
            </div>
          </form>
        </div>

        <div className='spare'></div>

        <div className='trade-type'>
          <form onSubmit={(e) => reqTrade(e, 'sell')}>
            <div className='desc-area'>
              <div className='text-area'>
                <span>수익율</span>
              </div>
              <div className='input-area'>
                <span className={
                  ticker.trade_price === userCoinData.price || userCoinData.amount === 0 ?
                    '' :
                    (ticker.trade_price > userCoinData.price ? 'colorRed' : 'colorBlue')
                }>
                  {
                    userCoinData.price ?
                      parseInt((ticker.trade_price - userCoinData.price) / userCoinData.price * 10000) / 100 :
                      0
                  } %
                </span>
              </div>
            </div>
            <div className='desc-area'>
              <div className='text-area'>
                <span>현재가</span>
              </div>
              <div className='input-area'>
                <span>{ticker.trade_price.toLocaleString('ko-KR')}</span>
              </div>
            </div>

            <div className='desc-area'>
              <div className='text-area'>
                <span>판매 수량</span>
              </div>
              <div className='input-area'>
                <input name='sellAmount' onChange={(event) => {
                  const newInputs = { ...inputs }
                  newInputs.sellAmount = event.target.value
                  setInputs(newInputs);
                }} value={inputs.sellAmount} />
              </div>
            </div>

            <div className='button-area'>
              <button className='bgColorBlue' name='reqSell'>판매하기</button>
            </div>

          </form>
        </div>

      </div >

      {/* 모의 거래 히스토리 영역 */}
      <div className='history'>
        <span>최근 거래 기록(5건)</span>
        <History />
      </div >

    </div >
  ) : (
    <Loading2 />
  );
};


// 코인 페이지
// coinPage 값에 따라 보여주는 페이지가 달라짐
const Coin = (props) => {
  const { appSetStates, componentSerial: marketName, componentPage: coinPage, userData } = props;
  const { setComponentSerial: setMarketName, setComponentPage: setCoinPage } = appSetStates;

  // const [coinPage, setCoinPage] = useState('home');
  // const [marketName, setMarketName] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const stateFuncs = {
    setCoinPage,
    setMarketName,
    setAutoRefresh,
  };

  if (coinPage !== 'home') {


    return (
      <DetailPage coin={coinPage} marketName={marketName} stateFuncs={stateFuncs} appSetStates={appSetStates} refresh={autoRefresh} userData={userData} />
    );
  } else {
    return (
      <MainPage stateFuncs={stateFuncs} />
    );
  }
};

export { Coin };

