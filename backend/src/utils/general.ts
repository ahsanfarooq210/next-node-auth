import dotenv from "dotenv";
import config from "config";

dotenv.config();

interface EnvVariables {
  prod: string;
  dev: string;
}

type ResponseTuple = [Document, number];

// Use process.env as a fallback if config doesn't have 'env'
const currentEnv: string = config.has("env")
  ? config.get("env")
  : process.env.NODE_ENV || "development";

const envVariables: EnvVariables = config.has("envVariables")
  ? config.get("envVariables")
  : {
      prod: "production",
      dev: "development",
    };

const isEnvProd: boolean = currentEnv === envVariables.prod;
const isEnvDev: boolean = currentEnv === envVariables.dev;

// Use a default value for frontendURL if it's not in the config
const frontendURLs: string[] = config.has("frontendURLs")
  ? config.get("frontendURLs")
  : ["http://localhost:3000"]; // Default fallback
const corsOrigin: string[] | boolean = isEnvProd ? frontendURLs : true;

export { ResponseTuple, corsOrigin, isEnvDev, isEnvProd, envVariables };
