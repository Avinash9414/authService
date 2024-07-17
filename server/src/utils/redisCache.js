const Redis = require("ioredis");
const config = require("../configs/authConfig");

const redis = new Redis({
  host: config.redisConfig.host,
  port: config.redisConfig.port,
  //   password: config.redisConfig.password,
});

module.exports = redis;
