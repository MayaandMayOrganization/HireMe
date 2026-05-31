// Must match the LiveKit project used by your token Lambda (same API key issuer).
export const LIVEKIT_URL =
  import.meta.env.VITE_LIVEKIT_URL ||
  'wss://hireme-khyjrqi7.livekit.cloud';

const AVATAR_CONTEXT_LAMBDA =
  import.meta.env.VITE_AVATAR_CONTEXT_URL ||
  'https://tiqv7tglmz2hb4qmpjrimr5pge0anuak.lambda-url.us-east-1.on.aws/';

// Local dev uses Vite proxy (see vite.config.js) to bypass Lambda CORS bug.
export const AVATAR_CONTEXT_URL = import.meta.env.DEV
  ? '/api/avatar-context'
  : AVATAR_CONTEXT_LAMBDA;

const LIVEKIT_TOKEN_LAMBDA =
  import.meta.env.VITE_LIVEKIT_TOKEN_URL ||
  'https://iexzogfkyuunk7b5sunmodusay0whgku.lambda-url.us-east-1.on.aws/';

// Local dev mints tokens with name/role embedded (see vite/dev-livekit-token.js).
export const LIVEKIT_TOKEN_URL = import.meta.env.DEV
  ? '/api/livekit-token'
  : LIVEKIT_TOKEN_LAMBDA;
