/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import NextAuth, { DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import axios from "axios";
import { JWT } from "next-auth/jwt";

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

async function refreshAccessToken(token: JWT) {
  try {
    const response = await axios.post(`${BACKEND_URL}/auth/refresh-token`, {
      refreshToken: token.refreshToken,
    });

    if (!response.data?.data?.accessToken) {
      return {
        ...token,
        error: "RefreshAccessTokenError",
      };
    }

    return {
      ...token,
      accessToken: response.data.data.accessToken,
      refreshToken: response.data.data.refreshToken || token.refreshToken,
      error: undefined,
    };
  } catch (error) {
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const response = await axios.post(`${BACKEND_URL}/auth/login`, {
            email: credentials.email,
            password: credentials.password,
          });

          if (response.data?.data?.user && response.data?.data?.token) {
            return {
              ...response.data.data.user,
              token: response.data.data.token,
              provider: "credentials",
            };
          }

          return null;
        } catch (error) {
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
          // For credentials provider, generate tokens using the initial token
          const response = await axios.post(
            `${BACKEND_URL}/auth/generate-tokens`,
            {
              token: user.token,
              tokenType: "initial",
            }
          );

          if (
            response.data?.data?.accessToken &&
            response.data?.data?.refreshToken
          ) {
            user.accessToken = response.data.data.accessToken;
            user.refreshToken = response.data.data.refreshToken;
            return true;
          }
        } else if (account?.provider === "google" && account?.access_token) {
          // For Google provider, generate tokens using the Google access token
          try {
            const response = await axios.post(
              `${BACKEND_URL}/auth/generate-tokens`,
              {
                token: account.id_token,
                tokenType: "google",
              }
            );

            console.log("generated token response", response.data);

            if (response.data?.accessToken && response.data?.refreshToken) {
              console.log("generated token response", );
              user.accessToken = response.data.accessToken;
              user.refreshToken = response.data.refreshToken;
              user.googleAccessToken = account.id_token;
              user.googleRefreshToken = account.refresh_token;
              user.id = response.data.user.id;
              user.firstName = response.data.user.firstName;
              user.lastName = response.data.user.lastName;
              user.email = response.data.user.email;
              user.imageUrl = response.data.user.imageUrl;
              return true;
            }
          } catch (error: any) {
            console.log(
              "Error during Google sign-in callback: generate token",
              error.message
            );
            throw error;
          }
        }

        return false;
      } catch (error) {
        console.error("Error during sign-in callback:", error);
        return false;
      }
    },

    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in
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

      // Return previous token if the access token has not expired yet
      if (
        typeof token.accessTokenExpires === "number" &&
        Date.now() < token.accessTokenExpires
      ) {
        return token;
      }

      // Access token has expired, try to refresh it
      console.log("about to refresh google token outer", {
        account,
        token,
      });

      if (token.provider === "google" && token.accessToken) {
        try {
          // First refresh the Google token using Next Auth's built-in mechanism
          console.log("about to refresh google token inner");
          const response = await fetch(
            "https://accounts.google.com/o/oauth2/token",
            {
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                grant_type: "refresh_token",
                refresh_token: token.refreshToken!,
              }),
              method: "POST",
            }
          );

          const tokens = await response.json();

          console.log("refreshed token", tokens);

          if (!response.ok) throw tokens;

          // Then use the new Google token to get fresh access/refresh tokens from your backend
          const backendResponse = await axios.post(
            `${BACKEND_URL}/auth/generate-tokens`,
            {
              token: tokens.access_token,
              tokenType: "google",
            }
          );

          return {
            ...token,
            accessToken: backendResponse.data.data.accessToken,
            refreshToken: backendResponse.data.data.refreshToken,
            error: undefined,
          };
        } catch (error) {
          return { ...token, error: "RefreshAccessTokenError" };
        }
      } else {
        // Regular token refresh for credentials provider
        return refreshAccessToken(token);
      }
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
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
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
});
