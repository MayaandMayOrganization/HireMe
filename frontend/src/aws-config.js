// Amplify v6 — used by `Amplify.configure()` in `index.js`
export const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_u56lBJUdL',
      userPoolClientId: 'sb893tp11fni580ojjfpp9u52',
      // App signs in with Cognito `username` (email local-part), not as email alias
      loginWith: {
        username: true,
      },
    },
  },
};