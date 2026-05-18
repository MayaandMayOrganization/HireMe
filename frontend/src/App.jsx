import React, { useState, useEffect } from 'react';
import { Login, SignUp, getCurrentUser, logout } from './AuthComponents';
import Dashboard from './components/Dashboard';
import InterviewPage from './InterviewPage';

function App() {
  const [authScreen, setAuthScreen] = useState('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [roomToken, setRoomToken] = useState(null);
  const [mainView, setMainView] = useState('dashboard');
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
        console.log('No active session found');
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, []);

  const handleStartInterview = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        'https://iexzogfkyuunk7b5sunmodusay0whgku.lambda-url.us-east-1.on.aws/'
      );

      if (!response.ok) {
        throw new Error('Failed to fetch token');
      }

      const data = await response.json();
      setRoomToken(data.token);
      setMainView('interview');
    } catch (err) {
      console.error('Error starting interview:', err);
      alert(
        'Could not connect to the avatar service. Please ensure the backend is running.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = (profile) => {
    if (profile) {
      setUserProfile(profile);
      setIsLoggedIn(true);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoggedIn(false);
      setUserProfile(null);
      setRoomToken(null);
      setMainView('dashboard');
      setAuthScreen('login');
    }
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

  return (
    <div className="app-root">
      {!isLoggedIn ? (
        <main className="app-main">
          <section className="app-form-section">
            <div style={{ maxWidth: '360px', width: '100%', margin: '0 auto' }}>
              <div
                style={{
                  color: '#5bf4de',
                  fontWeight: '900',
                  fontSize: '1.5rem',
                  marginBottom: '2.5rem',
                  letterSpacing: '-1px',
                }}
              >
                HireMe
              </div>

              {authScreen === 'login' ? (
                <Login onSwitch={() => setAuthScreen('signup')} onSuccess={handleLoginSuccess} />
              ) : (
                <SignUp onSwitch={() => setAuthScreen('login')} />
              )}
            </div>
          </section>

          <section className="app-video-section">
            <div className="app-video-overlay" aria-hidden />
            <video
              autoPlay
              loop
              muted
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }}
            >
              <source src="/handshake%20(1).mp4" type="video/mp4" />
            </video>
          </section>
        </main>
      ) : (
        <>
          {mainView === 'dashboard' ? (
            <Dashboard
              user={userProfile}
              onStartInterview={handleStartInterview}
              onLogout={handleLogout}
            />
          ) : (
            <InterviewPage
              token={roomToken}
              onBack={() => setMainView('dashboard')}
              onLogout={handleLogout}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;
