import express, { Request, Response } from "express";
import session = require("express-session");
import dotenv from "dotenv";
import bodyParser from "body-parser";
import { connectDB } from "./config/databse";
import router from "./routes/authRoute";
import "./config/passport";
import passport = require("passport");

dotenv.config();

const app = express();

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 2000;

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required!");
}

app.use(
  session({
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

async function main() {
  await connectDB();
}
app.use(router);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello world");
});

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
