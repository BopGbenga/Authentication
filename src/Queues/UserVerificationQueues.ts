import Queue from "bull";
import axios from "axios";

require("dotenv").config();
import { SendGrid } from "../utils/sendGrid";

const ipAPIAgent = axios.create({
  baseURL: "https://ipapi.co/",
  headers: {
    "User-Agent": "nodejs-ipapi-v1.02",
  },
  validateStatus: () => true,
});

const sendEmailQueue = new Queue("user Verification", {
  redis: {
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD,
    port: Number(process.env.REDIS_PORT),
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
  const { user, agent, date, ip, actionLink } = job.data;
  try {
    if (!agent) {
      console.log(`sending user verification mail to ${user.email}`);
      await SendGrid.sendVerification(user);
      console.log(`sent user verification mail to ${user.email}`);
    } else {
      console.log(`sending suspicious login mail to ${user.email}`);
      const { device, os, client } = agent;
      const ipInfo: any = {
        model: device.model || os.name,
        ip: ip,
        client: `${client.name} ${client.version}`,
        date: date,
      };

      try {
        const { data } = await ipAPIAgent.get(`${ip}/json/`);
        if (data?.country_name) {
          ipInfo.country = data.country_name;
        }
        if (data?.org) {
          ipInfo.org = data.org;
        }
      } catch (error) {
        console.log("Failed to fetch IP data:", error);
      }
      const link = actionLink || `${process.env.PREFIX_URL}/security`;
      await SendGrid.sendSuspiciousLogin(user, ipInfo, link);
      console.log(`sent suspicious login mail to ${user.email}`);
    }

    done();
  } catch (error) {
    console.error("Error processing email job:", error);
    done(error as any);
  }
});

const sendPasswordResetQueue = new Queue("password Reset", {
  redis: {
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD,
    port: Number(process.env.REDIS_PORT),
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "fixed",
      delay: 5000,
    },
  },
});

sendPasswordResetQueue.on("error", (error) => {
  console.log("password reset queue error");
  console.log(error);
});

sendPasswordResetQueue.process(async (job, done) => {
  const { user } = job.data;
  console.log(`sending password reset mail to ${user.email}`);
  try {
    await SendGrid.sendResetMail(user);
    console.log(`sent password reset mail to ${user.email}`);
    done();
  } catch (error) {
    console.log(error);
    done(error as any);
  }
});

export { sendEmailQueue, sendPasswordResetQueue };
