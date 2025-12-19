import React, { useEffect, useState } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { deleteBucketList } from "../../../features/bucketListSlice";
import "./BucketList.scss";
import { addPlace } from "../../../features/placeSlice";
import { useNavigate } from "react-router-dom";

const URL = "https://wikipedia-api1.p.rapidapi.com/search";

const BucketList = ({ place }) => {
  const dispatch = useDispatch();
  const [url, setUrl] = useState("");
  const navigate = useNavigate();

  const handleDelete = () => {
    dispatch(deleteBucketList(place._id));
  };

  useEffect(() => {
    const options = {
      params: { term: place.name },
      headers: {
        "X-RapidAPI-Key": "3577c7e511mshc86a7e414abb420p136946jsn425e8cfed5f8",
        "X-RapidAPI-Host": "wikipedia-api1.p.rapidapi.com",
      },
    };

    const getPhoto = async () => {
    // 1. Use the new, reliable URL
    const URL = "https://wikipedia.p.rapidapi.com/api/v2/search/";
    
    const options = {
        // 2. Use the correct parameter name 'term'
        params: { term: place.name }, 
        headers: {
            'X-RapidAPI-Key': '3577c7e511mshc86a7e414abb420p136946jsn425e8cfed5f8', // Use your valid key
            // 3. Use the new, reliable host
            'X-RapidAPI-Host': 'wikipedia.p.rapidapi.com' 
        }
    };

    try {
        const { data } = await axios.get(URL, options);
        // 4. Process the response from the new API
        if (data.articles && data.articles.length > 0) {
            const imageUrl = data.articles[0].image.url;
            // Now do something with the imageUrl
        }
    } catch (error) {
        console.error("Error fetching photo:", error);
    }
};

    getPhoto();
  }, [place]);

  const handleBucketListPlace = () => {
    dispatch(addPlace(place.place));
    navigate("/place");
  };

  return (
    <div className="card bucket">
      <img src={url} alt="bucketList" onClick={handleBucketListPlace} />
      <div className="places" onClick={handleBucketListPlace}>
        <h4>{place.place}</h4>
      </div>
      <div className="icons">
        <i className="fa-solid fa-trash-can" onClick={handleDelete}></i>
      </div>
    </div>
  );
};

export default BucketList;
