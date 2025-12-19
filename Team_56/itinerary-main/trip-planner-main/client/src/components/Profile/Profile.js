import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import BucketList from "./BucketList/BucketList";
import "./Profile.scss";
import { getUser } from "../../features/userSlice";
import {
  getBucketList,
  getBucketListItems,
} from "../../features/bucketListSlice";

const Profile = () => {
  const random = Math.ceil(Math.random() * 5);
  const profilePic = `profile${random}.jpg`;
  const handleMove = () => {
    window.scroll(0, 0);
  };

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector(getUser);
  const { bucketList } = useSelector(getBucketListItems);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
    // Only dispatch if user exists to avoid unnecessary errors
    if (user) {
      dispatch(getBucketList());
    }
  }, [user, navigate, dispatch]);

  return (
    <div className="container-fluid">
      <div className="container">
        <img src={profilePic} alt="profile" className="profile" />
      </div>
      <h2 className="container">Welcome, {user && user.name} !</h2>
      <div className="container">
        <p>Email : </p> <h4>{user && user.email}</h4>
        <hr />
        <p>Bio : </p> <h4>{user && user.bio}</h4>
        <hr />
      </div>
      <div className="move" onClick={handleMove}>
        <i className="fa-solid fa-angles-up"></i>
      </div>
      <div className="container bucket-list">
        <h5>Bucket List</h5>
        <div className="list">
          {/* --- FIX IS HERE: Check if it is an Array first --- */}
          {bucketList && Array.isArray(bucketList) && bucketList.length > 0 ? (
            bucketList.map((list) => (
              // Added optional chaining to key to be safe
              <BucketList place={list} key={list._id || list.id || Math.random()} />
            ))
          ) : (
            <h6>Nothing to show yet. Please add some destinations!</h6>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;