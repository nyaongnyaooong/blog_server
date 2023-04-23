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
          url: '/coindata'
        }
        const res = await axios.request(option);

        setTicker(res.data.ticker);
        setMarket(res.data.market);
      } catch (error) {

      }
    };

    // 초당 1회 정보 요청
    setInterval(() => {
      fetchData();
    }, 1000)
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
          setCoinPage(page);
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
    <div className="app alignCenter">
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
  const { coin, stateFuncs } = props;
  const { setCoinPage } = stateFuncs;

  // 차트 컴포넌트
  const Chart = () => {
    // const [candle, setCandle] = useState(null)
    const [series, setSeries] = useState(null);
    const [options, setOptions] = useState(null);

    useEffect(() => {
      const fetchData = async (count) => {
        try {
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

          response = await axios.request({
            method: 'get',
            url: 'https://api.upbit.com/v1/ticker?markets=' + coin
          });
          const ticker = response.data;
          const tickerObject = {
            x: Date.parse(ticker.candle_date_time_kst + 'Z'),
            y: [
              ticker.opening_price,
              ticker.high_price,
              ticker.low_price,
              ticker.trade_price
            ]
          }
          dataArray.push(tickerObject);
          const _series = [{ data: dataArray }];
          setSeries(_series);

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
              text: 'CandleStick Chart',
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

      setInterval(async () => {
        await fetchData(49);
      }, 1500)
    }, []);

    return series && options ? (
      <div id="chart">
        <ReactApexChart options={options} series={series} type="candlestick" height={400} width={600} />
      </div>
    ) : <div></div>;

  }

  return (
    <div className='app'>
      <div>
        <button onClick={() => { setCoinPage('main') }}>메인으로</button>
      </div>
      {/* <Result data={{ candle, ticker }} coin={coin} /> */}
      <Chart></Chart>
      <div className='trade'>
        <div className='buy'>
          <form>

            <div>
              <button>구매하기</button>
            </div>
          </form>
        </div>
        <div className='spare'></div>
        <div className='sell'>
          <form>

            <div>
              <button>판매하기</button>
            </div>
          </form>
        </div>
      </div>

    </div>
  )
  // <Loading2 />

};


// 코인 페이지
// coinPage 값에 따라 보여주는 페이지가 달라짐
const Coin = () => {
  const [coinPage, setCoinPage] = useState('main')
  const [marketName, setMarketName] = useState(null)

  const stateFuncs = {
    setCoinPage,
    setMarketName
  }

  if (coinPage !== 'main') {
    return (
      <DetailPage coin={coinPage} marketName={marketName} stateFuncs={stateFuncs} />
    );
  } else {
    return (
      <MainPage stateFuncs={stateFuncs} />
    );
  }
};

export { Coin };