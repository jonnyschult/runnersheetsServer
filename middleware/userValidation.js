require("dotenv").config();
const jwt = require("jsonwebtoken");
const { User } = require("../models");

const validation = (req, res, next) => {
  if (req.method == "OPTIONS") {
    next();
  } else {
    let userToken = req.headers.authorization;
    if (!userToken) {
      return res
        .status(403)
        .send({ authorized: false, message: "Must provide token." });
    } else {
      jwt.verify(userToken, process.env.JWT_SECRET, (err, decoded) => {
        if (decoded) {
          User.findOne({ where: { id: decoded.id } }).then(
            (user) => {
              req.user = user;
              next();
            },
            (err) => {
              res.status(401).send({ error: "No user found with token" });
            }
          );
        } else {
          res.status(400).send({ error: "Bad Request" });
        }
      });
    }
  }
};

module.exports = validation;
