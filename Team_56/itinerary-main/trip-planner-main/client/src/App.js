import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Home from "./components/Home/Home";
import Profile from "./components/Profile/Profile";
import Footer from "./components/Footer/Footer";
import Place from "./components/Place/Place";
import Login from "./components/Login/Login";
import Register from "./components/Register/Register";
import Generate from "./components/Generate/generate";
import Chatbot from "./components/Chatbot/Chatbot";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  return (
    <>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/place" element={<Place />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/generate" element={<Generate />} />
          <Route path="/chatbot" element={<Chatbot/>}/>
        </Routes>
        <Footer />
      </Router>
      <ToastContainer />
    </>
  );
};

export default App;
