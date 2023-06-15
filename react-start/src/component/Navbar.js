// eslint-disable-next-line
import axios from 'axios';
import '../css/navbar.css'

const Nav = (props) => {
  const { btnList, btnAct, appSetStates, userData } = props;
  const { setLgnFrmAct, setBgDarkAct, setRegFrmAct, setUserData, setPage, setComponentPage } = appSetStates;

  //left section (로고, 이름)
  const BtnLeftSect = () => {
    return (

      <button className={"btn_nav_page " + (btnAct === 0 ? "nav_btn_active" : "nav_btn_deactive")} onClick={() => {
        setPage(0);
      }}>
        NyaongNyaooong
      </button>

    )
  }

  //middle section (navigate buttons)
  const BtnMidSect = () => {
    const btnArray = [];
    for (let i = 1; i < btnList.length - 1; i++) {
      const btnName = btnList[i];
      let btnClass = "btn_nav_page ";

      (i === btnAct) ? btnClass += "nav_btn_active" : btnClass += "nav_btn_deactive";
      btnArray.push(
        <li key={i}>
          <button className={btnClass} onClick={() => {
            setComponentPage('home');
            setPage(i);
          }}>
            {btnName}
          </button>
        </li>
      )
    };
    return btnArray;
  }

  // right section : user data
  const BtnRightSect = () => {
    const FormUser = () => {
      return (
        <div className="nav_r_section">
          <button className="btn_login_section" onClick={() => {
            setPage(btnList.length - 1);
          }}>{userData}</button>
          <button className="btn_login_section" onClick={async () => {
            // document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            await axios.get('/logout');

            setUserData('anonymous');
          }}>LogOut</button>
        </div>
      )
    }

    const FormAnonymous = () => {
      return (
        <div className="nav_r_section">
          <button className="btn_login_section" onClick={() => {
            setLgnFrmAct(true);
            setBgDarkAct(true);
          }}>LogIn</button>
          <button className="btn_login_section" onClick={() => {
            setRegFrmAct(true);
            setBgDarkAct(true);
          }}>Register</button>
        </div>
      )
    }

    return userData !== 'anonymous' ? <FormUser /> : <FormAnonymous />
  };

  return (
    <div className="navbar">
      {/* Navigationbar left section */}
      <div className="nav_l_section">
        <div className="divMark" >
          <img src="/68260365.png" alt=""></img>
        </div>
        <BtnLeftSect></BtnLeftSect>
      </div>

      {/* Navigationbar mid section */}
      <div className="nav_m_section">
        <ul className='menuList'>
          <BtnMidSect></BtnMidSect>
        </ul>
      </div>

      {/* Navigationbar right section */}
      <BtnRightSect />

    </div>
  )
};

export default Nav;




