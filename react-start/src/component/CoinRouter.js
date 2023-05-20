import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loading2 } from './Loading';
import ReactApexChart from "react-apexcharts";


// 메인페이지 컴포넌트
const MainPage = (props) => {
  const { stateFuncs } = props;
  const { setCoinPage, setMarketName } = stateFuncs;
  const [market, setMarket] = useState(null);
  const [ticker, setTicker] = useState(null);

  // 코인데이터 주기적으로 받아옴
  useEffect(() => {
    // 코인 ticker 요청 함수
    const fetchData = async () => {
      try {
        const option = {
          method: 'get',
          url: '/coin/data'
        }
        const res = await axios.request(option);

        setTicker(res.data.ticker);
        setMarket(res.data.market);
      } catch (error) {

      }
    };

    // 초당 1회 정보 요청
    const timer = setInterval(() => {
      fetchData();
    }, 1000)

    return () => {
      clearInterval(timer);
    };
  }, [])

  // thead 컴포넌트
  const CoinTableHead = () => {
    return (
      <thead>
        <tr>
          <th className='width40'>순번</th>
          <th className='width200'>종목</th>
          <th className='width100'>기호</th>
          <th className='width100'>현재가</th>
          <th className='width100'>전일대비</th>
          <th className='width150'>거래대금(24H)</th>
        </tr>
      </thead>
    )
  }

  // tbody 컴포넌트
  const CoinTableBody = (props) => {
    const { data } = props;

    const Href = (props) => {
      const { page, children } = props
      return (
        <a href='/' onClick={(event) => {
          event.preventDefault();
          setCoinPage([page]);
          setMarketName(children);
        }}>
          {children}
        </a>
      )
    }

    const array = [];
    data.forEach((elm, idx) => {
      let classColor;
      if (elm.trade_price > elm.opening_price) classColor = 'colorRed'
      else if (elm.trade_price < elm.opening_price) classColor = 'colorBlue';

      array.push(
        <tr key={idx}>
          {/* 순번 */}
          <td className='alignCenter'>{idx + 1}</td>
          {/* 종목 */}
          <td className='alignCenter'><Href page={elm.market}>{market[idx].korean_name}</Href></td>
          {/* 기호 */}
          <td className='alignCenter'><Href page={elm.market}>{elm.market}</Href></td>
          {/* 현재가 */}
          <td className='alignRight'>{elm.trade_price.toLocaleString('ko-KR')}</td>
          {/* 전일대비 */}
          <td className={'alignRight ' + classColor}>
            {Math.floor(10000 * (elm.trade_price - elm.opening_price) / elm.opening_price) / 100}
            %
          </td>
          {/* 거래대금 */}
          <td className='alignRight'>
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
    <div className="appCoin alignCenter ani_fadeIn">
      <div>
        <h1>암호화폐 모의투자</h1>
      </div>
      <div>
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
  const coin = props.coin;

  const { marketName, stateFuncs, refresh, stateFunctions } = props;
  const { setCoinPage, setAutoRefresh } = stateFuncs;
  const { setLgnFrmAct, setBgDarkAct } = stateFunctions;

  const [series, setSeries] = useState(null);
  const [options, setOptions] = useState(null);
  const [ticker, setTicker] = useState(null);

  const [userCoinData, setUserCoinData] = useState({});

  const [inputs, setInputs] = useState({
    buyAmount: '',
    sellAmount: '',
  });

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
          {'[' + coin + '] ' + marketName + ' '}
        </span>
        {priceTag}
      </div>
    );
  }

  useEffect(() => {
    if (ticker) {
      const newUserCoinData = { ...userCoinData }
      const balance = newUserCoinData.balance || 0;
      const price = ticker.trade_price || 1;
      newUserCoinData.maxBuy = parseInt(balance / price * 10000) / 10000;
      setUserCoinData(newUserCoinData);
    }
  }, [coin, ticker])

  // 캔들 데이터 get 후 그래프 그려냄 > 1초마다 반복
  useEffect(() => {
    const initFetchData = async () => {
      const response = await axios.request({
        method: 'get',
        url: '/user/coin',
        params: {
          market: coin[0],
        }
      });

      if (response.data.result) {
        const newUserCoinData = { ...userCoinData }
        newUserCoinData.balance = response.data.result.money;
        newUserCoinData.coinAmount = response.data.result.amount;
        newUserCoinData.price = response.data.result.price;

        setUserCoinData(newUserCoinData);

      }
    }
    initFetchData();

    const fetchData = async (count) => {
      try {
        // 캔들데이터
        let response = await axios.request({
          method: 'get',
          url: 'https://api.upbit.com/v1/candles/minutes/1?market=' + coin + '&count=' + count
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
          url: 'https://api.upbit.com/v1/ticker?markets=' + coin
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
            height: 350
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
      } catch (error) {
        console.log(error);
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

  }, [coin, refresh]);

  const reqTrade = async (event, tradeType) => {
    event.preventDefault();
    let inputValue;
    if (tradeType === 'buy') {
      inputValue = Number(event.target.buyAmount.value);
    } else if (tradeType === 'sell') {
      inputValue = Number(event.target.sellAmount.value);
    }

    try {
      if (isNaN(inputValue)) throw new Error('03');
      console.log(inputValue)

      const response = await axios.request({
        method: 'post',
        url: '/user/coin/trade',
        data: {
          request: tradeType,
          market: coin[0],
          amount: inputValue,
        },
      });

      const { result, error } = response.data;

      if (error) throw new Error(error);

      if (result) {
        setCoinPage([...coin]);
      }
    } catch (error) {
      const code = error.message
      if (code === '00') alert('알 수 없는 오류 발생');

      if (code === '01') {
        alert('로그인 해주세요');
        setLgnFrmAct(true);
        setBgDarkAct(true);
      };

      if (code === '02') alert('잔액이 부족합니다\n(구매전에는 충분했더라도 시장가가 변하여 부족해졌을 수 있습니다)');
      if (code === '03') alert('숫자만 입력해주세요');



    }
  }

  return series && options && ticker ? (
    <div className='app'>

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
            <button onClick={() => { setCoinPage(['main']) }}>메인으로</button>
          </div>

        </div>
      </div>

      <div id="chart">
        <ReactApexChart options={options} series={series} type="candlestick" height={300} width={600} />
      </div>

      <div className='trade'>
        <div className='trade-type'>
          <form onSubmit={(e) => reqTrade(e, 'buy')}>
            <div className='desc-area'>
              <div className='text-area'>
                <span>잔액</span>
              </div>
              <div className='input-area'>
                <span>{userCoinData.balance ? userCoinData.balance.toLocaleString('ko-KR') : 0}</span>
              </div>
            </div>
            <div className='desc-area'>
              <div className='text-area'>
                최대 구매 가능 수량
              </div>
              <div className='input-area'>
                <span>{userCoinData.maxBuy || 0}</span>
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
                <span>보유 수량</span>
              </div>
              <div className='input-area'>
                <span>{userCoinData.coinAmount}</span>
              </div>
            </div>
            <div className='desc-area'>
              <div className='text-area'>
                <span>현재가</span>
              </div>
              <div className='input-area'>
                <span>{ticker.trade_price}</span>
              </div>
            </div>
            <div className='desc-area'>
              <div className='text-area'>
                <span>평단가</span>
              </div>
              <div className='input-area'>
                {
                  ticker.trade_price === userCoinData.price || userCoinData.price === 0 ?
                    <span>{userCoinData.price}</span> :
                    (
                      ticker.trade_price > userCoinData.price ?
                        <span className='colorBlue'>{userCoinData.price}</span> :
                        <span className='colorRed'>{userCoinData.price}</span>
                    )
                }

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

      </div>

    </div>
  ) : (
    <Loading2 />
  );
};


// 코인 페이지
// coinPage 값에 따라 보여주는 페이지가 달라짐
const Coin = (props) => {
  const { stateFunctions } = props;

  const [coinPage, setCoinPage] = useState(['main']);
  const [marketName, setMarketName] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const stateFuncs = {
    setCoinPage,
    setMarketName,
    setAutoRefresh,
  };

  if (coinPage[0] !== 'main') {
    return (
      <DetailPage coin={coinPage} marketName={marketName} stateFuncs={stateFuncs} stateFunctions={stateFunctions} refresh={autoRefresh} />
    );
  } else {
    return (
      <MainPage stateFuncs={stateFuncs} />
    );
  }
};

export { Coin };