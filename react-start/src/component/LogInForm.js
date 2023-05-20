import { useEffect, useState } from 'react';

import axios from 'axios';

const GoogleLogo = () => {
  return (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" version="1.1" x="0px" y="0px" viewBox="0 0 48 48" enableBackground="new 0 0 48 48" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12
	c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24
	c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657
	C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36
	c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571
	c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>
  )
}

const FormGroup = (props) => {
  const { children } = props;
  return (
    <div className="form_group">
      {children}
    </div>
  )
}

const InputGroup = (props) => {
  const { children } = props;
  return (
    <div className="input_group">
      {children}
    </div>
  )
}

const ButtonGroup = (props) => {
  const { children } = props;
  return (
    <div className="button_group">
      {children}
    </div>
  )
}

const DivLineGroup = (props) => {
  const { children } = props;
  return (
    <div className="divine_line_group">
      {children}
    </div>
  )
}

const LogInForm = (props) => {
  const { active, stateFuncs } = props;
  const { setLgnFrmAct, setBgDarkAct, setUserData } = stateFuncs;

  const [data, setData] = useState(null);



  let [inputID, setInputID] = useState('');
  let [inputPW, setInputPW] = useState('');
  let [message, setMessage] = useState('');


  const redirectGoogleLogin = async () => {
    try {
      const response = await axios.request({
        method: 'get',
        url: '/domain',
      });

      if (response.data) window.location.assign(response.data + '/login/google');
    } catch (error) {
 
    }
  }

  const reqLogIn = async (e) => {
    e.preventDefault();
    const reqObject = {
      loginID: inputID,
      loginPW: inputPW
    }
    try {
      const response = await axios.post('/login/post', reqObject);
      if (response.data.result) {
        setLgnFrmAct(false);
        setBgDarkAct(false);
        setUserData(response.data.result);
      } else {
        console.log(response.data.error)
        // throw new Error(response.data.error);
      }

    } catch (err) {
      console.log(err);
      setMessage('에러');
    }
  }

  return (
    <div className={(active) ? "login_box ani_fadeInUp" : "login_box zhide"}>
      {/* <form action="/login/post" method="POST"> */}
      <form onSubmit={reqLogIn}>
        <FormGroup />

        <FormGroup>
          <span className="login_form_title">NyaongNyaooong</span>
          <input type='hidden' name='url'></input>
        </FormGroup>

        <FormGroup>
          <span className="wrong_form">
            {/* 로그인 요청에 문제 발생시 여기에 메세지 표시 */}
            {message}
          </span>
        </FormGroup>

        <FormGroup>
          <InputGroup>
            <input type="text" placeholder="아이디" onChange={(e) => {
              setInputID(e.target.value);
            }} value={inputID} name='inputID'></input>

          </InputGroup>
        </FormGroup>

        <FormGroup>
          <InputGroup>
            <input type="password" placeholder="비밀번호" onChange={(e) => {
              setInputPW(e.target.value);
            }} value={inputPW} name='inputPW'></input>

          </InputGroup>
        </FormGroup>

        <FormGroup>
          <ButtonGroup>
            <button type="submit" className="btn btn-primary">로그인</button>
          </ButtonGroup>
        </FormGroup>

        <FormGroup>
          <DivLineGroup>
            <div className="divine_line_box">
              <div className="divine_line"></div>
            </div>

            <div className="divine_line_box_mid">
              <div className="divine_line_text">
                <span>또는</span>
              </div>
            </div>

            <div className="divine_line_box">
              <div className="divine_line"></div>
            </div>
          </DivLineGroup>
        </FormGroup>
      </form>

      <FormGroup>
        <div className='oauth'>
          <div className='oauth-button'>
            <button onClick={redirectGoogleLogin}>
              <GoogleLogo /> Google 계정으로 로그인하기
            </button>
          </div>
        </div>
      </FormGroup>

      <FormGroup />
      <FormGroup />

    </div>
  )
};


const RegisterForm = (props) => {

  const { active } = props;


  return (
    <div className={(active) ? "login_box ani_fadeInUp" : "login_box zhide"}>
      <form action="/register/post" method="POST">
        <FormGroup />

        <FormGroup>
          <span className="login_form_title">Register</span>
        </FormGroup>

        <FormGroup>
          <span className="wrong_form">
            {/* 회원가입 요청에 문제 발생시 여기에 메세지 표시 */}
            ex Wrong Password
          </span>
        </FormGroup>

        <FormGroup>
          <InputGroup>
            <input type="text" aria-describedby="emailHelp" placeholder="아이디" name="regID"></input>
          </InputGroup>
        </FormGroup>

        <FormGroup>
          <InputGroup>
            <input type="password" placeholder="비밀번호" name="regPW"></input>
          </InputGroup>
        </FormGroup>

        <FormGroup>
          <ButtonGroup>
            <button type="submit" className="btn btn-primary">회원가입</button>
          </ButtonGroup>
        </FormGroup>

        <FormGroup>
          <DivLineGroup>
            <div className="divine_line_box">
              <div className="divine_line"></div>
            </div>

            <div className="divine_line_box_mid">
              <div className="divine_line_text">
                <span>또는</span>
              </div>
            </div>

            <div className="divine_line_box">
              <div className="divine_line"></div>
            </div>
          </DivLineGroup>
        </FormGroup>

        <FormGroup>
          <span className="login_form_title">OAuth2 예정</span>
        </FormGroup>

        <FormGroup />
        <FormGroup />
      </form>
    </div>
  )
};

export { LogInForm, RegisterForm };