import express, { Request, Response } from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import { connectDB } from "./config/databse";
import router from "./routes/authRoute";

dotenv.config();

const app = express();

app.use(bodyParser.json());
app.use(express.json());

const PORT = process.env.PORT || 2000;

async function main() {
  await connectDB();
}
app.use(router);
app
  .listen(PORT, () => {
    console.log(`server is running on ${PORT}`);
  })
  .on("error", (err) => {
    console.error("server startup error", err);
  });
main().catch((error) => {
  console.log(error);
  throw error;
});
