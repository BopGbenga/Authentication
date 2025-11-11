import redis, { createClient } from "redis";

async function main() {
  const client = createClient({
    username: "dafault",
    password: process.env.REDIS_PASSWORD,

    socket: {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      tls: true,
    },
  });
  client.on("error", (err: any) => console.log("Redis client error", err));

  await client.connect();
  await client.set("foo", "bar");

  const result = await client.get("foo");
  console.log(result);
}
main();
