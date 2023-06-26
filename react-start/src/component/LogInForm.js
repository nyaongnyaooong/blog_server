// eslint-disable-next-line
import { useEffect, useState } from 'react';

import axios from 'axios';

class CustomError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CustomError';
  }
}

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

const ErrorMessage = (props) => {
  const { message } = props;

  return (
    <span className="wrong_form ani_fadeOut">
      {/* 로그인 요청에 문제 발생시 여기에 메세지 표시 */}
      {message}
    </span>
  );
}

const LogInForm = (props) => {
  const { active, appSetStates } = props;
  const { setLgnFrmAct, setBgDarkAct, setUserData } = appSetStates;


  const [inputID, setInputID] = useState('');
  const [inputPW, setInputPW] = useState('');
  const [message, setMessage] = useState('');
  const [loginActive, setLoginActive] = useState(true);

  const reqLogIn = async (e) => {
    e.preventDefault();
    if (!loginActive) return
    setLoginActive(false);
    setTimeout(() => {
      setLoginActive(true);
    }, 1600)
    const reqObject = {
      loginID: inputID,
      loginPW: inputPW
    }
    try {
      if (/[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]|\s/g.test(inputID)) throw new CustomError('입력할 수 없는 문자가 섞여있습니다');
      if (!inputID) throw new CustomError('아이디를 입력해주세요');
      if (!inputPW) throw new CustomError('패스워드를 입력해주세요');

      const response = await axios.request({
        method: 'post',
        url: '/login',
        data: {
          ...reqObject
        },
      });

      setLgnFrmAct(false);
      setBgDarkAct(false);
      setUserData(response.data.result);
      window.location.href = '/';

    } catch (err) {
      let errorMessage = '알 수 없는 에러입니다'
      if (err instanceof CustomError) {
        setMessage(err.message);
        setTimeout(() => {
          setMessage('');
        }, 1500)
      } else {
        if (err?.response?.data.error) errorMessage = err.response.data.error;
        setMessage(errorMessage);
        setTimeout(() => {
          setMessage('');
        }, 1500)
      }

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
          {
            message ? <ErrorMessage message={message} /> : <></>
          }

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
            <button onClick={() => {
              window.location.assign(window.location.origin + '/login/google');
            }}>
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

  const [message, setMessage] = useState('');
  const [loginActive, setLoginActive] = useState(true);

  const reqRegister = async (e) => {
    e.preventDefault();
    const regId = e.target.regId.value;
    const regPw = e.target.regPw.value;
    const regPwAgain = e.target.regPwAgain.value;

    if (!loginActive) return 0;
    setLoginActive(false);

    setTimeout(() => {
      setLoginActive(true);
    }, 1600)

    try {
      if (!regId) throw new CustomError('아이디를 입력해주세요');
      if (!regPw) throw new CustomError('패스워드를 입력해주세요');
      if (regPw !== regPwAgain) throw new CustomError('패스워드 확인문자가 다릅니다');
      if (!/^[0-9 | a-z]+$/g.test(regId)) throw new CustomError('영문자 혹은 숫자의 조합만 아이디로 사용할 수 있습니다');
      if (regId.includes('admin')) throw new CustomError('아이디로 사용할 수 없는 문자가 섞여있습니다(admin)');
      if (regId.includes('google')) throw new CustomError('아이디로 사용할 수 없는 문자가 섞여있습니다(google)');
      if (regId.includes('anonymous')) throw new CustomError('아이디로 사용할 수 없는 문자가 섞여있습니다(anonymous)');
      if (regId.length > 13) throw new CustomError('아이디는 12글자 이하만 사용할 수 있습니다');
      if (regId.length < 4) throw new CustomError('아이디는 4글자 이상만 사용할 수 있습니다');
      if (regPw.length < 8) throw new CustomError('패스워드는 8자 이상 입력해주세요');

      const response = await axios.request({
        method: 'post',
        url: '/register',
        data: {
          regId,
          regPw
        },
      });

      window.location.href = window.location.origin;
    } catch (err) {
      let errMessage = '알 수 없는 오류입니다'
      if (err instanceof CustomError) errMessage = err.message;
      else if (err?.response?.data.error) errMessage = err.response.data.error;

      setMessage(errMessage);
      setTimeout(() => {
        setMessage('');
      }, 1500)
    }
  }

  return (
    <div className={(active) ? "login_box ani_fadeInUp" : "login_box zhide"}>
      <form onSubmit={reqRegister}>
        <FormGroup />

        <FormGroup>
          <span className="login_form_title">Register</span>
        </FormGroup>

        <FormGroup>
          {
            message ? <ErrorMessage message={message} /> : <></>
          }
        </FormGroup>

        <FormGroup>
          <InputGroup>
            <input type="text" aria-describedby="emailHelp" placeholder="아이디" name="regId"></input>
          </InputGroup>
        </FormGroup>


        <FormGroup>
          <InputGroup>
            <input type="password" placeholder="비밀번호" name="regPw"></input>
          </InputGroup>
        </FormGroup>

        <FormGroup>
          <InputGroup>
            <input type="password" placeholder="비밀번호 확인" name="regPwAgain"></input>
          </InputGroup>
        </FormGroup>

        <FormGroup>
          <ButtonGroup>
            <button type="submit" className="btn btn-primary">회원가입</button>
          </ButtonGroup>
        </FormGroup>

        <FormGroup>
          {/* <DivLineGroup>
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
          </DivLineGroup> */}
        </FormGroup>

        <FormGroup />
        <FormGroup />
      </form>
    </div>
  )
};

export { LogInForm, RegisterForm };