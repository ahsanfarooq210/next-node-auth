 /* eslint-disable @typescript-eslint/no-unused-vars */
import NextAuth, { Account, DefaultSession, User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import axios from "axios";
import { JWT } from "next-auth/jwt";
import { jwtDecode } from "jwt-decode";

// Type declarations remain the same...
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    googleAccessToken?: string;
    googleRefreshToken?: string;
    error?: string;
    provider?: string;
    user: {
      id?: string | undefined;
      firstName: string;
      lastName: string;
      email?: string | null | undefined;
      imageUrl?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string | undefined;
    firstName: string;
    lastName: string;
    email?: string | null | undefined;
    imageUrl?: string;
    accessToken?: string;
    refreshToken?: string;
    googleAccessToken?: string;
    googleRefreshToken?: string;
    token?: string;
    provider?: string;
    accessTokenExpires?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    googleAccessToken?: string;
    googleRefreshToken?: string;
    provider?: string;
    error?: string;
    user: {
      id?: string | undefined;
      firstName: string;
      lastName: string;
      email?: string | null | undefined;
      imageUrl?: string;
    };
  }
}

const BACKEND_URL = process.env.BACKEND_URL;

// Token management functions
const isTokenExpired = (token: string): boolean => {
  if (!token) return true;
  try {
    const decodedToken = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    if (!decodedToken.exp) return true;
    return decodedToken.exp < currentTime;
  } catch (error) {
    console.error("Error decoding token:", error);
    return true;
  }
};

const refreshBackendAccessToken = async (token: JWT) => {
  try {
    const response = await axios.post(`${BACKEND_URL}/auth/refresh-token`, {
      refreshToken: token.refreshToken,
    });

    if (!response.data?.accessToken) {
      return { ...token, error: "RefreshAccessTokenError" };
    }

    return {
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken || token.refreshToken,
      error: undefined,
    };
  } catch (error) {
    return { ...token, error: "RefreshAccessTokenError" };
  }
};

const refreshGoogleToken = async (googleRefreshToken: string) => {
  const response = await fetch("https://accounts.google.com/o/oauth2/token", {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: googleRefreshToken,
    }),
    method: "POST",
  });

  if (!response.ok) {
    throw await response.json();
  }

  return response.json();
};

// Authentication handlers
const handleCredentialsSignIn = async (user: User) => {
  const response = await axios.post(`${BACKEND_URL}/auth/generate-tokens`, {
    token: user.token,
    tokenType: "initial",
  });

  if (response.data?.accessToken && response.data?.refreshToken) {
    user.accessToken = response.data.accessToken;
    user.refreshToken = response.data.refreshToken;
    return true;
  }
  return false;
};

const handleGoogleSignIn = async (user: User, account: Account) => {
  const response = await axios.post(`${BACKEND_URL}/auth/generate-tokens`, {
    token: account.id_token,
    tokenType: "google",
  });

  if (response.data?.accessToken && response.data?.refreshToken) {
    Object.assign(user, {
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
      googleAccessToken: account.id_token,
      googleRefreshToken: account.refresh_token,
      ...response.data.user,
    });
    return true;
  }
  return false;
};

// Token refresh handler
const handleTokenRefresh = async (token: JWT) => {
  let updatedToken = { ...token };
  const accessTokenExpired = token.accessToken
    ? isTokenExpired(token.accessToken)
    : true;
  const googleAccessTokenExpired = token.googleAccessToken
    ? isTokenExpired(token.googleAccessToken)
    : false;

  if (token.provider === "google" && googleAccessTokenExpired) {
    try {
      const tokens = await refreshGoogleToken(token.googleRefreshToken!);
      updatedToken = {
        ...token,
        googleAccessToken: tokens.id_token,
        error: undefined,
      };
    } catch (error) {
      return { ...token, error: "RefreshAccessTokenError" };
    }
  }

  if (accessTokenExpired) {
    const backendTokenData = await refreshBackendAccessToken(token);
    updatedToken = { ...token, ...backendTokenData };
  }

  return updatedToken;
};

// NextAuth configuration
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      type: "credentials",
      credentials: {
        username: { type: "string", label: "Email" },
        password: { type: "string", label: "Password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        try {
          const response = await axios.post(`${BACKEND_URL}/auth/login`, {
            email: credentials.username,
            password: credentials.password,
          });

          if (response.data.user && response.data.token) {
            return {
              ...response.data.user,
              token: response.data.token,
              provider: "credentials",
            };
          }
          return null;
        } catch (error) {
          console.log("error in credentials authorize function", error);
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      try {
        if (account?.provider === "credentials" && user.token) {
          return await handleCredentialsSignIn(user);
        } else if (account?.provider === "google" && account?.access_token) {
          return await handleGoogleSignIn(user, account);
        }
        return false;
      } catch (error) {
        console.error("Error during sign-in callback:", error);
        return false;
      }
    },

    async jwt({ token, user, account, trigger, session }) {
      if (user && account) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.googleAccessToken = user.googleAccessToken;
        token.googleRefreshToken = user.googleRefreshToken;
        token.provider = account.provider;
        token.user = {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          imageUrl: user.imageUrl,
        };
        return token;
      }

      return handleTokenRefresh(token);
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.googleAccessToken = token.googleAccessToken;
      session.googleRefreshToken = token.googleRefreshToken;
      session.error = token.error;
      session.provider = token.provider;
      session.user = {
        ...token.user,
        id: token.user.id ?? "",
        email: token.user.email ?? "",
        emailVerified: new Date(),
      };
      return session;
    },
  },
  pages: {
    signIn: "/signin",
    error: "/error",
  },
  session: {
    strategy: "jwt",
  },
});
