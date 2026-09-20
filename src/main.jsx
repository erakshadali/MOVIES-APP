import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { ProfileProvider } from './context/ProfileContext.jsx'
import ProfileScope from './context/ProfileScope.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ProfileProvider>
        <ProfileScope>
          <App />
        </ProfileScope>
      </ProfileProvider>
    </BrowserRouter>
  </React.StrictMode>
)
