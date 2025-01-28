import dotenv from "dotenv";
import { app } from "./app";
import { logger } from "./middleware/logger.middleware";
import { errorHandler } from "./middleware/error.middleware";

dotenv.config();
const port: number = parseInt(process.env.BACKEND_PORT || "3002", 10);

app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});

app.use(errorHandler);
