import React from 'react';
import './about.css';

const AboutUs = () => {
  return (
    <div className="about-us">
      <div className="about-us-content">
        <h1>About AgroCare AI</h1>
        <p>
          AgroCare AI is dedicated to transforming the agricultural landscape through intelligent, AI-powered technologies.
          Our mission is to empower farmers with real-time disease detection, actionable insights, and innovative tools to promote smarter,
          greener, and more sustainable farming practices.
        </p>
        <p>
          With a blend of cutting-edge machine learning algorithms and deep expertise in plant science, AgroCare AI delivers
          innovative solutions that help increase productivity, reduce crop losses, and enhance sustainability across all levels of farming.
          We believe in making advanced agricultural technology accessible to every farmer, from small-scale operations to large commercial farms.
        </p>
        <p>
          Our platform leverages state-of-the-art deep learning models trained on thousands of plant disease images to provide
          accurate, instant diagnoses. Whether you're dealing with potato blight, tomato leaf curl, or capsicum bacterial spot,
          AgroCare AI identifies the problem and provides comprehensive treatment recommendations tailored to your specific situation.
        </p>
        <p>
          Beyond disease detection, we integrate real-time weather data to predict disease risks and provide preventive measures.
          Our dashboard tracks your prediction history, helping you monitor trends and make data-driven decisions for your crops.
          Join us in revolutionizing smart agriculture and building a more sustainable future for farming.
        </p>
        <h2>Contact Us</h2>
        <p><a href="mailto:agrocareai@gmail.com">agrocareai@gmail.com</a></p>
      </div>
    </div>
  );
};

export default AboutUs;
