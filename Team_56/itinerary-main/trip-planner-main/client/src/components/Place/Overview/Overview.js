import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addPlace, getPlace } from "../../../features/placeSlice";
import axios from "axios";
import "./Overview.scss";

const URL = "https://wikipedia.p.rapidapi.com/api/v2/search/";

const Overview = () => {
  const [location, setLocation] = useState("");
  const dispatch = useDispatch();
  const { place } = useSelector(getPlace);
  const [info, setInfo] = useState();

  const handleSearch = (e) => {
    e.preventDefault();

    dispatch(addPlace(location));
    setLocation("");
  };

 // In Overview.js

useEffect(() => {
    if (!place) return; // Exit early if there's no place

    const options = {
        // 1. UPDATE THE PARAMS: The parameter must be 'term', not 'q'
        params: { term: place.name },
        headers: {
            "X-RapidAPI-Key": "3577c7e511mshc86a7e414abb420p136946jsn425e8cfed5f8", // IMPORTANT: Use your valid key
            // 2. UPDATE THE HOST: This must match the new API's host
            "X-RapidAPI-Host": "wikipedia.p.rapidapi.com",
        },
    };

    const getPlaceDetail = async () => {
        setInfo(null); // Clear previous info while loading
        try {
            // 3. UPDATE THE URL: It needs the full '/api/v2/search/' path
            const { data } = await axios.get("https://wikipedia.p.rapidapi.com/api/v2/search/", options);
            
            if (data.articles && data.articles.length > 0) {
                setInfo(data.articles[0]);
            } else {
                console.log("No articles found for this place.");
            }
        } catch (error) {
            console.error("Error fetching Wikipedia details:", error);
        }
    };

    getPlaceDetail();
}, [place]);

  return (
    <>
      <div className="search">
        <div className="container">
          <input
            type="text"
            placeholder="Search your destination"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <button onClick={handleSearch}>Search</button>
      </div>
      {place && info && (
        <div className="information-container">
          <h4>{place.toUpperCase()}</h4>
          <div className="details">
            <div className="para">
              {info.summary.map((s, i) => (
                <p key={i}>{s}</p>
              ))}
            </div>
            {info.image && (
              <img
                src={info.image}
                alt="placePic"
                height="300px"
                width="400px"
                style={{ objectFit: "cover", borderRadius: "20px" }}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Overview;
