import express, { Request, Response } from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";

dotenv.config();

const app = express();

app.use(bodyParser.json());
app.use(express.json());

const PORT = process.env.PORT || 2000;

app
  .listen(PORT, () => {
    console.log(`server is running on ${PORT}`);
  })
  .on("error", (err) => {
    console.error("server startup error", err);
  });
