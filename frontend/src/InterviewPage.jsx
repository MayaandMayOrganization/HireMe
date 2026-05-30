import React, { useState, useEffect, useRef } from 'react';
import { 
  LiveKitRoom, 
  ControlBar, 
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
  useTranscriptions,
  GridLayout,
  useVoiceAssistant,
  useLocalParticipant,
  useRemoteParticipants,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';
import { LIVEKIT_URL } from './config';

function MyVideoLayout() {
    const tracks = useTracks([Track.Source.Camera]);

  return (
    <GridLayout tracks={tracks} style={{ height: 'calc(100vh - 200px)' }}>
      <ParticipantTile />
    </GridLayout>
  );
}

function LiveTranscription() {
  const segments = useTranscriptions();

  if (!segments || segments.length === 0) {
    return (
      <div style={{ marginTop: '20px', color: '#888', fontStyle: 'italic' }}>
        Waiting for speech (Deepgram STT)...
      </div>
    );
  }

  return (
    <div style={{ 
      marginTop: '20px', 
      padding: '15px', 
      border: '2px solid #00ff00',
      borderRadius: '8px',
      backgroundColor: '#1a1a1a',
      color: 'white',
      minHeight: '100px',
      textAlign: 'left'
    }}>
      <h4 style={{ color: '#00ff00' }}>Live Transcript:</h4>
      {segments.map((s, index) => (
        <p key={s.id ?? `${s.participant?.identity}-${index}`} style={{ margin: '5px 0' }}>
          <strong style={{ color: '#aaa' }}>{s.participant?.identity || 'User'}:</strong> {s.text}
        </p>
      ))}
    </div>
  );
}

/** Mute the user's mic while the agent speaks/thinks — prevents speaker echo without headphones. */
function MicGateWhileAgentSpeaks() {
  const { state } = useVoiceAssistant();
  const remoteParticipants = useRemoteParticipants();
  const { localParticipant } = useLocalParticipant();
  const micEnabledRef = useRef(null);

  const avatarSpeaking = remoteParticipants.some(
    (p) =>
      p.isSpeaking &&
      (p.identity.includes('agent') ||
        p.identity.includes('simli') ||
        p.identity.includes('avatar'))
  );

  const shouldEnableMic =
    !avatarSpeaking && state !== 'speaking' && state !== 'thinking';

  useEffect(() => {
    if (!localParticipant) return undefined;
    if (micEnabledRef.current === shouldEnableMic) return undefined;

    const applyMicState = () => {
      micEnabledRef.current = shouldEnableMic;
      localParticipant.setMicrophoneEnabled(shouldEnableMic).catch((err) => {
        console.warn('Mic gate toggle failed:', err);
      });
    };

    if (shouldEnableMic) {
      const timer = setTimeout(applyMicState, 400);
      return () => clearTimeout(timer);
    }

    applyMicState();
    return undefined;
  }, [shouldEnableMic, localParticipant]);

  return null;
}

const InterviewPage = ({ token, avatarContext, onBack, onLogout }) => {
    const [isStarted, setIsStarted] = useState(false);
    const [connectionError, setConnectionError] = useState(null);
    const serverUrl = LIVEKIT_URL;

    if (!token) {
        return (
            <div style={{ textAlign: 'center', marginTop: '100px', color: 'white' }}>
                <h2>No Session Token Found</h2>
                <p>Waiting for the Lambda/Manual token to arrive...</p>
                <button onClick={onBack} style={{marginTop: '20px'}}>Go Back</button>
            </div>
        );
    }

    if (!isStarted) {
        return (
        <div style={{ textAlign: 'center', marginTop: '100px', color: 'white' }}>
            <h2>Ready to start?</h2>
            {avatarContext && (
              <p style={{ color: '#a5abbd', marginBottom: '16px' }}>
                Interview for: <strong style={{ color: '#5bf4de' }}>{avatarContext.role}</strong>
              </p>
            )}
            <button
            onClick={() => setIsStarted(true)}
            style={{ padding: '15px 30px', fontSize: '18px', cursor: 'pointer', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}
            >
            Join Interview & Enable Mic
            </button>
        </div>
        );
    }

    return (
        <div style={{ padding: '20px', height: '100vh', backgroundColor: '#111', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0 }}>Interview Session</h2>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                    color: '#a5abbd',
                    border: '1px solid #424858',
                    borderRadius: '6px',
                  }}
                >
                  Log out
                </button>
              )}
            </div>
            {connectionError && (
              <div style={{
                marginBottom: '16px',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: '#3b1c1c',
                border: '1px solid #7f1d1d',
                color: '#fca5a5',
                fontSize: '14px',
              }}>
                Could not connect to LiveKit: {connectionError}
                <div style={{ marginTop: '8px', color: '#f87171', fontSize: '12px' }}>
                  The token Lambda and frontend must use the same LiveKit project URL.
                </div>
              </div>
            )}
            <LiveKitRoom
                video={true}
                audio={{
                  echoCancellation: true,
                  noiseSuppression: true,
                  autoGainControl: true,
                }}
                token={token}
                serverUrl={serverUrl}
                connect={true}
                options={{
                  audioCaptureDefaults: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                  },
                }}
                onConnected={() => {
                  console.log('Frontend joined!');
                  setConnectionError(null);
                }}
                onError={(err) => {
                  console.error('Room Error:', err);
                  setConnectionError(err.message || String(err));
                }}
            >
                <MicGateWhileAgentSpeaks />
                <MyVideoLayout />
                <RoomAudioRenderer />
                <ControlBar controls={{ screenShare: false }} />
                <LiveTranscription />
        </LiveKitRoom>
        </div>
    );
};

export default InterviewPage;