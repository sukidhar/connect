const express = require("express");
const { v4: generateUUID, stringify } = require("uuid");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const Neode = require("neode");
const bcrypt = require("bcrypt");
const neo4j = new Neode.fromEnv().with({
  User: require("./app_handlers/Models/User"),
  Room: require("./app_handlers/Models/Room"),
});
const redis = require("redis");
const engines = require("consolidate");
const redisClient = redis.createClient({
  retry_strategy: (options) => {
    console.log(options.error);
    return Math.min(options.attempt * 100, 1000);
  },
});

const port = process.env.PORT | 4500;
const path = require("path");
var app = express();
app.use("/", express.static(path.resolve(__dirname, "/connect-front-end")));
// app.set("html", engines.swig);
// app.set("view engine", "html");
app.set("view engine", "pug");

app.use(express.json());

var server = app.listen(port, async () => {
  neo4j.schema
    .install()
    .then(() => {
      console.log("schema installed");
    })
    .catch((err) => {});
  console.log("server started successfully at port " + port);
});

var neode = require("./app_handlers/neode_handler")(
  neo4j,
  bcrypt,
  generateUUID,
  nodemailer,
  jwt,
  redisClient
);

var keyStore = require("./app_handlers/redis_handler")(redisClient);

var io = require("socket.io")(server);

require("./app_handlers/socketio_handler")(
  io,
  neode,
  redisClient,
  jwt,
  generateUUID,
  keyStore
);

app.get("/:roomId", (req, res) => {
  console.log(req.params);
  res.render(__dirname + "/connect-front-end/index.html");
});

app.get("/reset/password/:token", async (req, res) => {
  let token = req.params.token;
});

app.get("/verify/:token", async (req, res) => {
  let token = req.params.token;
  const user = jwt.verify(token, process.env.TOKEN_SECRET, (error, data) => {
    if (error) {
      console.log(error);
      res.status(403).send("expired or invalid token");
      return;
    }
    console.log(data);
    neode
      .verifyUser(data.id)
      .then((response) => {
        res.send(response);
      })
      .catch((err) => console.log(err));
  });
});
