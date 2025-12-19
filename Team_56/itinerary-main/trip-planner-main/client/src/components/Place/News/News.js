// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import "./News.scss";
// import { useSelector } from "react-redux";
// import { getPlace } from "../../../features/placeSlice";

// const URL = "https://bing-news-search1.p.rapidapi.com/news/search";

// const News = () => {
//   const [news, setNews] = useState([]);
//   const { place } = useSelector(getPlace);

//   useEffect(() => {
//     const options = {
//       params: {
//         q: { place },
//         freshness: "Day",
//         textFormat: "Raw",
//         safeSearch: "Off",
//       },
//       headers: {
//         "X-BingApis-SDK": "true",
//         // "X-RapidAPI-Key": "02830c346emsh2606c2508f81c59p1b7059jsn5006c032fb80",
//         "X-rapidapi-Key":"094ee793a9msh94b7f6fa9f51542p12e65bjsn98e6ed0c75bd",
//         "X-rapidapi-Host": "bing-news-search1.p.rapidapi.com",
//       },
//     };
//     const getNews = async () => {
//       const {
//         data: { value },
//       } = await axios.get(URL, options);
//       setNews(value);
//     };

//     if (place !== "") {
//       getNews();
//     }
//   }, [place]);
//   return (
//     <>
//       {news && (
//         <div className="news-container">
//           <h5 style={{ fontWeight: "700" }}>News from {place.toUpperCase()}</h5>
//           {news.map((n, i) => (
//             <div className="card" key={i}>
//               <div className="headline">
//                 <a href={n.url} target="_blank" rel="noreferrer noopener">
//                   {n.name}
//                 </a>
//                 <p>{n.description}</p>
//               </div>
//               <div className="img">
//                 <img
//                   src={n.image ? n.image.thumbnail.contentUrl : ""}
//                   alt="news"
//                 />
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </>
//   );
// };

// export default News;
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./News.scss";
import { useSelector } from "react-redux";
import { getPlace } from "../../../features/placeSlice";

const URL = "https://news-api14.p.rapidapi.com/v2/search/publishers";

const News = () => {
  const [news, setNews] = useState([]);
  const { place } = useSelector(getPlace);

  useEffect(() => {
    const options = {
      params: {
        query: place, // Using 'query' instead of 'q' as per API documentation
      },
      headers: {
        "X-RapidAPI-Key": "6045bd5227mshc895831bda5f734p193db8jsn4018bfffd9a3", // Your valid API key
        "X-RapidAPI-Host": "news-api14.p.rapidapi.com", // Correct API host
      },
    };
    const getNews = async () => {
      const {
        data: { data },
      } = await axios.get(URL, options);
      setNews(data);
    };

    if (place !== "") {
      getNews();
    }
  }, [place]);

  return (
    <>
      {news && (
        <div className="news-container">
          <h5 style={{ fontWeight: "700" }}>News from {place.toUpperCase()}</h5>
          {news.map((n, i) => (
            <div className="card" key={i}>
              <div className="headline">
                <a href={n.url} target="_blank" rel="noreferrer noopener">
                  {n.title}
                </a>
                <p>{n.description}</p>
              </div>
              <div className="img">
                <img
                  src={n.logo ? n.logo : ""}
                  alt="news"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default News;