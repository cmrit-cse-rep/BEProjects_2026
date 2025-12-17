import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { Auth0Provider } from '@auth0/auth0-react';
import './index.css'

// // Access env variables with import.meta.env
// const domain = import.meta.env.VITE_AUTH0_DOMAIN
// const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID
// const audience = import.meta.env.VITE_API_IDENTIFIER

ReactDOM.createRoot(document.getElementById("root")).render(
  <Auth0Provider
    // domain="dev-uco6t85dzenc0bsd.us.auth0.com"
    domain="dev-c0dxzv6vxq77zfqm.us.auth0.com"
    // clientId="DjyjYvvLNfHneEmCIIsm3HaJZzipC2VI"
    clientId='05ZS1gWDiyV9mkDszjao97UeYkG8Obfy'
    authorizationParams={{
      redirect_uri: window.location.origin,
      audience: "https://seed-sync/api",
      scope: "openid profile email predict:read"
    }}
  >
    <App />
  </Auth0Provider>
)


    // ReactDOM.createRoot(document.getElementById('root')).render(
    //   <Auth0Provider
    //     domain="dev-uco6t85dzenc0bsd.us.auth0.com"
    //     clientId="https://seed-sync/api"
    //     authorizationParams={{
    //       redirect_uri: window.location.origin
    //     }}
    //   >
    //     <App />
    //     </Auth0Provider>
    // )
