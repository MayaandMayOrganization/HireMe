import React, { useState, useEffect} from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { Login, SignUp } from './AuthComponents';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import InterviewPage from './InterviewPage';

const GlobalStyle = createGlobalStyle`
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body, html { 
    width: 100%; height: 100%; margin: 0;
    background-color: #080e1c; color: #e0e5f9;
    font-family: 'Inter', -apple-system, sans-serif;
    overflow: hidden;
  }
`;

const Container = styled.div` height: 100vh; width: 100vw; display: flex; flex-direction: column; `;
const Main = styled.main` flex: 1; display: flex; width: 100%; overflow: hidden; `;

const FormSection = styled.section`
  width: 100%; display: flex; flex-direction: column; justify-content: center;
  padding: 0 2rem; z-index: 2; background: #080e1c;
  @media (min-width: 1024px) { width: 40%; padding: 0 4rem; }
`;

const VideoSection = styled.section`
  display: none; position: relative; background: #000; height: 100%;
  @media (min-width: 1024px) { display: block; flex: 1; }
`;

const VideoOverlay = styled.div`
  position: absolute; inset: 0; 
  background: linear-gradient(to right, #080e1c, transparent 40%); 
  z-index: 1;
`;

function App() {
  const [view, setView] = useState('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [roomToken, setRoomToken] = useState(null); // State to store the LiveKit token
  const [view, setView] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await getCurrentUser(); 
        if (user) {
          setUserProfile(user);
          setIsLoggedIn(true);
        }
      } catch (err) {
        console.log("No active session found");
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, []);

  // handle automatic activation
  const handleStartInterview = async () => {
    setIsLoading(true);
    try {
      // Fetch the token from your Lambda (via API Gateway)
      const response = await fetch('https://iexzogfkyuunk7b5sunmodusay0whgku.lambda-url.us-east-1.on.aws/');
      
      if (!response.ok) {
        throw new Error('Failed to fetch token');
      }

      const data = await response.json();
      
      // Save the token in state
      setRoomToken(data.token);
      
      // Switch to the interview view
      setView('interview');
    } catch (err) {
      console.error("Error starting interview:", err);
      alert("Could not connect to the avatar service. Please ensure the backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    setUserProfile(profile);
    setIsLoggedIn(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080e1c] flex items-center justify-center">
        <div className="text-[#5bf4de] font-black text-2xl animate-pulse tracking-tighter">
          HireMe
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} authService={AuthComponents} />;
  }

 return (
    <Container>
      <GlobalStyle />
      {!isLoggedIn ? (
        <Main>
          <FormSection>
            <div style={{ maxWidth: '360px', width: '100%', margin: '0 auto' }}>
              <div style={{ color: '#5bf4de', fontWeight: '900', fontSize: '1.5rem', marginBottom: '2.5rem', letterSpacing: '-1px' }}>
                HireMe
              </div>
              
              {view === 'login' ? (
                <Login onSwitch={() => setView('signup')} onSuccess={handleLoginSuccess} />
              ) : (
                <SignUp onSwitch={() => setView('login')} />
              )}
            </div>
          </FormSection>
          
          <VideoSection>
            <VideoOverlay />
            <video 
              autoPlay loop muted playsInline 
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }}
            >
              <source src="/handshake (1).mp4" type="video/mp4" />
            </video>
          </VideoSection>
        </Main>
      ) : (
        <>
          {view === 'dashboard' ? (
            <Dashboard 
              user={userProfile} 
              onStartInterview={handleStartInterview} 
            />
          ) : (
            <InterviewPage 
              token={roomToken} 
              onBack={() => setView('dashboard')} 
            />
          )}
        </>
      )}
    </Container>
  );
}

export default App;