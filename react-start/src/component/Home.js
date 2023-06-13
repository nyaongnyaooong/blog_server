// eslint-disable-next-line

import { useState } from 'react';

const GitLogo = (props) => {
  const logoSize = props.logoSize || 32;
  return <svg height={logoSize} aria-hidden="true" viewBox="0 0 16 16" version="1.1" width={logoSize} data-view-component="true">
    <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
  </svg>
}

const PageIntro = (props) => {



  const cardClassName = props.active ? 'profile-intro ani_fadeIn' : 'profile-intro hidden';
  return (
    <div className={cardClassName}>
      <div className='profile-title'>
        <h2>Introduce</h2>
      </div>

      <div className='profile-intro-content'>

        <div className='profile-intro-content-img'>
          <img src='/profile.jpg' alt='profile'></img>
        </div>

        <div className='profile-intro-content-text'>
          <div className='about'>
            <div className='title'>About</div>
            <span>정재아</span>
            <span>1992.05.22</span>
            <span>한양대 에리카 캠퍼스 전자시스템공학부</span>
          </div>
          <div className='channel'>
            <div className='title'>Github & Blog</div>
            <a href='https://github.com/nyaongnyaooong' target='_blank' rel="noreferrer">
              <GitLogo /><span>https://github.com/nyaongnyaooong</span>
            </a>
            <a href='https://blog.naver.com/ashah29' target='_blank' rel="noreferrer">
              <img src='/blog.png' alt='blog' /><span>https://blog.naver.com/ashah29</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

const PageSkill = (props) => {
  const cardClassName = props.active ? 'profile-skill ani_fadeIn' : 'profile-skill hidden';

  return (
    <div className={cardClassName}>
      <div className='profile-title'>
        <h2>Skills</h2>
      </div>

      <div className='profile-skill-content'>
        <div className='group' align='center'>
          <h3>Web & Front-end</h3>
          <img src="https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white" alt='HTML5' />
          <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white" alt='CSS3' />
          <img src="https://img.shields.io/badge/Javascript-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt='Javascript' />
          <img src="https://img.shields.io/badge/Typescript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt='Typescript' />
          <br />
          <img src="https://img.shields.io/badge/React.js-61DAFB?style=flat-square&logo=react&logoColor=black" alt='React.js' />
          <br />
          <h3>Back-end</h3>
          <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=Node.js&logoColor=white" alt='Node.js' />
          <img src="https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white" alt='Express' />
          <img src="https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white" alt='MySQL' />
          <img src="https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=MongoDB&logoColor=white" alt='MongoDB' />
          <br />
          <h3>Etc</h3>
          <img src="https://img.shields.io/badge/Github-181717?style=flat-square&logo=github&logoColor=white" alt='Github' />
          <br />
          <img src="https://img.shields.io/badge/C++-00599C?style=flat-square&logo=c%2B%2B&logoColor=white" alt='C++' />
          <img src="https://img.shields.io/badge/Python-3776AB?style==flat-square&logo=python&logoColor=white" alt='Python' />
        </div>
      </div>

    </div>
  )
}

const PageProjectIntro = (props) => {
  const cardClassName = props.active ? 'profile-project ani_fadeIn' : 'profile-project hidden';

  return (
    <div className={cardClassName}>
      <div className='profile-title'>
        <h2>프로젝트</h2>
      </div>
      <div className='profile-content'>


        <div className='project'>
          <div className='title'>
            <span>코인 모의 매매</span>
          </div>

          <div className='useSkill'>
            <img src="https://img.shields.io/badge/Typescript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt='Typescript' />
            <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=Node.js&logoColor=white" alt='Node.js' />
            <img src="https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white" alt='Express' />
            <img src="https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white" alt='MySQL' />
            <img src="https://img.shields.io/badge/React.js-61DAFB?style=flat-square&logo=react&logoColor=black" alt='React.js' />
          </div>

          <div className='detail'>
            <span>
              실시간 코인 시세 확인 및 회원가입 &
              <br />
              로그인 후 모의 구매 및 판매 서비스
            </span>
          </div>
        </div>

        <div className='project'>
          <div className='title'>
            <span>자유 게시판</span>
          </div>

          <div className='useSkill'>
            <img src="https://img.shields.io/badge/Typescript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt='Typescript' />
            <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=Node.js&logoColor=white" alt='Node.js' />
            <img src="https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white" alt='Express' />
            <img src="https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white" alt='MySQL' />
            <img src="https://img.shields.io/badge/React.js-61DAFB?style=flat-square&logo=react&logoColor=black" alt='React.js' />
          </div>

          <div className='detail'>
            <span>
              회원가입 & 로그인 후
              <br />
              게시글 및 댓글 작성 서비스
            </span>
          </div>
        </div>


      </div>
    </div>
  )
}

const Navigate = (props) => {
  const { state, stateFunctinon } = props;

  return (
    <div className="profile-navigate">
      <div className='button-left'>
        <button onClick={() => {
          if (state > 0) stateFunctinon(state - 1);
        }}>◀</button>
      </div>
      <div className='text'>
        <span>{state + 1} / 3</span>
      </div>
      <div className='button-right'>
        <button onClick={() => {
          if (state < 2) stateFunctinon(state + 1);
        }}>▶</button>
      </div>
    </div>
  )
}

// 메인 소개 페이지
const Home = () => {
  const [profilePage, setProfilePage] = useState(0)

  return (
    <div className="content_box content-home">
      <div className="content-title">
        <h2>
          개인 프로젝트
        </h2>
      </div>
      <div className="content">
        <div className="content-text">
          <p>
            코인 모의 거래 사이트 및 자유게시판 입니다.<br />
            프로젝트에 대한 자세한 설명은 git 레포지토리를 참조해주세요.
          </p>
        </div>
        <div className="content-git">
          <a href='https://github.com/nyaongnyaooong/coin_trade' target='_blank' rel="noreferrer">
            <GitLogo logoSize='24' /><span>https://github.com/nyaongnyaooong/coin_trade</span>
          </a>
          <a href='https://blog.naver.com/ashah29' target='_blank' rel="noreferrer">
            <img src='/blog.png' alt='blog' /><span>https://blog.naver.com/ashah29</span>
          </a>
        </div>
      </div>


    </div>
  )

  // return (
  //   <div className="content_box content-profile">
  //     {profilePage === 0 ? <PageIntro active={true} /> : <PageIntro />}
  //     {profilePage === 1 ? <PageSkill active={true} /> : <PageSkill />}
  //     {profilePage === 2 ? <PageProjectIntro active={true} /> : <PageProjectIntro />}

  //     <Navigate state={profilePage} stateFunctinon={setProfilePage} />

  //   </div>
  // )
}


export { Home };
