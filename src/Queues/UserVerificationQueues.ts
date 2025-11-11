import Queue from "bull";
import axios from "axios";

require("dotenv").config();
import { SendGrid } from "../utils/sendGrid";

const sendEmailQueue = new Queue("user Verification", {
  redis: {
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD,
    port: Number(process.env.REDIS_PORT),
    tls: true,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "fixed",
      delay: 5000,
    },
  },
});
sendEmailQueue.on("error", (error) => {
  console.log("user verification queue error");
  console.log(error);
});
sendEmailQueue.process(async (job, done) => {
  const { user, agent, date, ip } = job.data;
  try {
    if (!agent) {
      console.log(`sender user verification mail ${user.email}`);
      await SendGrid.sendVerification(user);
      console.log(`sent user verification mail to ${user.email}`);
    } else {
      console.log(`sending suspiscious login mail to ${user.email}`);
    }
  } catch (error) {}
});
