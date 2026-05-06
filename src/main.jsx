import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Amplify } from 'aws-amplify';

Amplify.configure({
    Auth: {
        Cognito: {
            userPoolId: 'us-east-1_u56lBJUdL',
            userPoolClientId: 'sb893tp11fni580ojjfpp9u52',
            region: 'us-east-1' // <--- תוסיפי את השורה הזו
        }
    }
}); 

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)