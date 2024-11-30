import express from "express";
import { router } from "./routes/v1";
import "dotenv/config";
const app = express();
app.use(express.json());
app.use("/api/v1", router);
app.listen(3000, () => {
  console.log("HTTP server listening to port 3000.");
});
