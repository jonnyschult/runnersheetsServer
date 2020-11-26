require("dotenv").config();
const { User } = require("../models/");
const sequelize = require("../db");
const { Router } = require("express");
const bcrypt = require("bcrypt");
let jwt = require("jsonwebtoken");
const { UniqueConstraintError } = require("sequelize");
const { userValidation } = require("../middleware");

const fitbitController = Router();
/***************************
 * USER REGISTER
 ***************************/
fitbitController.get("/fitbitCS", async (req, res) => {
  try {
    res.status(200).json({
      message: "success",
      cs: process.env.FITBIT_CLIENT_SECRETE,
      redirectURI: "http://localhost:3000/athlete",
    });
  } catch (err) {
    res.status(500).send({ err, message: "Server Error" });
  }
});

module.exports = fitbitController;
