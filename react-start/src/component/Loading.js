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

export default Loading;