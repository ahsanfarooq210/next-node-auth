import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();

const generateTokens = (user: { id: string }) => {
  const accessToken = jwt.sign(
    { userId: user.id },
    process.env.ACCESS_TOKEN_SECRET as string,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.REFRESH_TOKEN_SECRET as string,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

const generateInitialToken = (user: { id: string }) => {
  return jwt.sign(
    { userId: user.id },
    process.env.INITIAL_TOKEN_SECRET as string,
    { expiresIn: "5m" }
  );
};

export class AuthService {
  static async signup(
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ) {
    try {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return { status: 400, data: { message: "User already exists" } };
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          password: hashedPassword,
        },
      });

      return { status: 201, data: { message: "User created successfully" } };
    } catch (error) {
      return { status: 500, data: { message: "Internal server error" } };
    }
  }

  static async login(email: string, password: string) {
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return { status: 401, data: { message: "Invalid credentials" } };
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return { status: 401, data: { message: "Invalid credentials" } };
      }

      const initialToken = generateInitialToken(user);

      return {
        status: 200,
        data: {
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            imageUrl: user.imageUrl,
          },
          token: initialToken,
        },
      };
    } catch (error) {
      return { status: 500, data: { message: "Internal server error" } };
    }
  }

  static async generateAuthTokens(initialToken: string) {
    try {
      if (!initialToken) {
        return { status: 401, data: { message: "Token required" } };
      }

      const decoded = jwt.verify(
        initialToken,
        process.env.INITIAL_TOKEN_SECRET as string
      ) as { userId: string };

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        return { status: 403, data: { message: "Invalid token" } };
      }

      const { accessToken, refreshToken } = generateTokens(user);

      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: await bcrypt.hash(refreshToken, 10) },
      });

      return {
        status: 200,
        data: { accessToken, refreshToken },
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return { status: 403, data: { message: "Invalid token" } };
      }
      return { status: 500, data: { message: "Internal server error" } };
    }
  }

  static async refreshAccessToken(refreshToken: string) {
    try {
      if (!refreshToken) {
        return { status: 401, data: { message: "Refresh token required" } };
      }

      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET as string
      ) as { userId: string };

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (
        !user ||
        !user.refreshToken ||
        !bcrypt.compare(refreshToken, user.refreshToken)
      ) {
        return { status: 403, data: { message: "Invalid refresh token" } };
      }

      const { accessToken, refreshToken: newRefreshToken } =
        generateTokens(user);

      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: await bcrypt.hash(newRefreshToken, 10) },
      });

      return {
        status: 200,
        data: { accessToken, refreshToken: newRefreshToken },
      };
    } catch (error) {
      return { status: 500, data: { message: "Internal server error" } };
    }
  }
}
