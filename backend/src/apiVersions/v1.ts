import { Application } from "express";
import authRouter from "../routes/auth.route";

export const prepareV1Routes = (app: Application) => {
  const prefix = "/api/v1/";
  app.use(`${prefix}auth`, authRouter);
};
