import '../css/loading.css';

const Loading = (props) => {
  if (props.active)
    return (
      <div id="loading" className="ani_fadeOut" style={{ backgroundColor: "rgb(41, 41, 41)" }}>
        <div className="sk-chase">
          <div className="sk-chase-dot"></div>
          <div className="sk-chase-dot"></div>
          <div className="sk-chase-dot"></div>
          <div className="sk-chase-dot"></div>
          <div className="sk-chase-dot"></div>
          <div className="sk-chase-dot"></div>
        </div>
      </div>
    )
}

const Loading2 = () => {
  return (
    <div className='content_box loading'>
      <div className='loader loader-6'>
        <div className='loader-inner'></div>
      </div>
      <div>
        <span>Loading..</span>
      </div>
    </div>
  )
}

export { Loading, Loading2 };