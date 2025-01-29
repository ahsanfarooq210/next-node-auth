import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";

export class AuthController {
  static async signup(req: Request, res: Response) {
    try {
      const { firstName, lastName, email, password } = req.body;
      const response = await AuthService.signup(
        firstName,
        lastName,
        email,
        password
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const response = await AuthService.login(email, password);
      res.status(response.status).json(response.data);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async refreshAccessToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      const response = await AuthService.refreshAccessToken(refreshToken);
      res.status(response.status).json(response.data);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }
}
