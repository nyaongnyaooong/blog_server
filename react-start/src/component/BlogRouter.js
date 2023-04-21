import '../css/board.css'
// import { Link, useParams, useNavigate } from 'react-router-dom';
// import { CKEditor } from '@ckeditor/ckeditor5-react';
// import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import axios from 'axios';
import { useState, useEffect } from 'react';

// 블로그 페이지
const Blog = () => {

  let [blogList, setBlogList] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/blog/title');
        const titleList = response.data;

        const titleObject = {};
        for (let i = 0; i < titleList.length; i++) {
          if (titleList[i].pTitle !== 'top') {
            titleObject[titleList[i].pTitle] = titleObject[titleList[i].pTitle] || [];
            titleObject[titleList[i].pTitle].push(titleList[i].title);
          }
        }

        const ul1Array = [];
        Object.keys(titleObject).forEach(elm1 => {
          ul1Array.push(<li>{elm1}</li>);

          const ul2Array = [];
          titleObject[elm1].forEach(elm2 => {
            ul2Array.push(<li>{elm2}</li>);
          });
          ul1Array.push(<ul>{ul2Array}</ul>)
        });
        setBlogList(ul1Array);
      } catch {

      }
    }
    fetchData();

  }, []);


  return blogList? (
    <div className="content_box ani_fadeIn" id="blog">
      <ul>{blogList}</ul>
    </div>
  ) : (<div className="content_box" id="blog"></div>);
}


export { Blog };