const redis = require("./src/redis.js");

(async () => {
  await redis.set("test", "working");
  const value = await redis.get("test");
  console.log("Redis test:", value);
})();
