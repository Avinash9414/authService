const express = require("express");
const session = require("express-session");
const RedisStore = require("connect-redis").default;
const redisClient = require("./utils/redisCache");
const config = require("./configs/authConfig");
const Authrouter = require("./routes/authRouter");
const userRouter = require("./routes/userRouter");
const errorHandler = require("./utils/errorHandler");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const logger = require("morgan");

const app = express();
const port = 3000;

app.use(
  cors({
    origin: [
      "http://localhost:4000",
      "http://localhost:5173",
      "https://login.microsoftonline.com",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(
  session({
    store: new RedisStore({ client: redisClient, ttl: 2 * 60 * 60 }),
    secret: process.env.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      maxAge: 2 * 60 * 60 * 1000,
    },
  })
);

app.use(logger("dev"));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use("/auth", Authrouter);
app.use("/users", userRouter);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Auth service listening at http://localhost:${port}`);
});
