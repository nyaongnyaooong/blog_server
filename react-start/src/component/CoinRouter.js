import { useState, useEffect } from 'react';
import axios from 'axios';

const MainPage = (props) => {
  const { stateFuncs } = props;
  const { setCoinPage } = stateFuncs;
  const [market, setMarket] = useState(null);
  const [ticker, setTicker] = useState(null);

  useEffect(() => {
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

    setInterval(() => {
      fetchData();
    }, 1000)
  }, [])

  const CoinTableHead = () => {
    return (
      <thead>
        <tr>
          <th className='width40'>순번</th>
          <th className='width200'>종목</th>
          <th className='width100'>기호</th>
          <th className='width100'>현재가</th>
          <th className='width100'>전일대비</th>
          <th className='width175'>거래대금(24H)</th>
        </tr>
      </thead>
    )
  }

  const CoinTableBody = (props) => {
    const { data } = props;

    const Href = (props) => {
      const { page, children } = props
      return (
        <a href='/' onClick={(event) => {
          event.preventDefault();
          setCoinPage(page);
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
          <td className='alignCenter'>{idx + 1}</td>
          <td className='alignCenter'><Href page={elm.market}>{market[idx].korean_name}</Href></td>
          <td className='alignCenter'><Href page={elm.market}>{elm.market}</Href></td>
          <td className='alignRight'>{elm.trade_price}</td>
          <td className={'alignRight ' + classColor}>
            {
              Math.floor(10000 * (elm.trade_price - elm.opening_price) / elm.opening_price) / 100
            }%
          </td>
          <td className='alignRight'>{Math.floor(100 * elm.acc_trade_price_24h) / 100}</td>
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


  return ticker ? (
    <div className="App alignCenter">
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
  ) : (
    <div>
      Loading..
    </div>
  )
}

const Coin = () => {
  const [coinPage, setCoinPage] = useState('main')

  const stateFuncs = {
    setCoinPage
  }

  if (coinPage !== 'main') {

  } else {
    return (
      <MainPage stateFuncs={stateFuncs} />
    );
  }
};

export { Coin };