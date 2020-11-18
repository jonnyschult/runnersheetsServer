const { User } = require("../models/");
const sequelize = require("../db");
const { Router } = require("express");
const bcrypt = require("bcrypt");
let jwt = require("jsonwebtoken");
const { UniqueConstraintError } = require("sequelize");
const { userValidation } = require("../middleware");

const userController = Router();
/***************************
 * USER REGISTER
 ***************************/
userController.post("/register", async (req, res) => {
  const {
    email,
    firstName,
    lastName,
    password,
    heightInInches,
    weightInPounds,
    age,
    isPremium,
    isCoach,
  } = req.body;

  try {
    const newUser = await User.create({
      email: email,
      firstName: firstName,
      lastName: lastName,
      passwordhash: bcrypt.hashSync(password, 10),
      heightInInches: heightInInches,
      weightInPounds: weightInPounds,
      age: age,
      isPremium: isPremium,
      isCoach: isCoach,
    });
    let token = await jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.json({
      user: newUser,
      message: "User created",
      loginToken: token,
    });
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      res.status(409).json({
        message: "Account with that email already taken.",
      });
    } else {
      res.send(500, err.message);
    }
  }
});

/***************************
 * USER LOGIN
 ***************************/
userController.post("/login", async (req, res) => {
  let { email, password } = req.body;
  try {
    await User.findOne({ where: { email } }).then((account) => {
      if (account) {
        bcrypt.compare(password, account.passwordhash, (err, matches) => {
          if (matches) {
            let token = jwt.sign({ id: account.id }, process.env.JWT_SECRET, {
              expiresIn: "1d",
            });
            res.status(200).json({
              user: account,
              message: "You're Logged in!",
              loginToken: token,
            });
          } else {
            res.status(403).send({ error: "Wrong password" });
          }
        });
      } else {
        res.status(403).send({ error: "No such user" });
      }
    });
  } catch (err) {
    (err) => {
      res.status(500).send({ error: "server error" });
    };
  }
});

/**************************
    UPDATE USER INFO
**************************/
userController.put("/updateUser", userValidation, async (req, res) => {
  const {
    email,
    firstName,
    lastName,
    heightInInches,
    weightInPounds,
    age,
    isPremium,
    isCoach,
  } = req.body;
  const owner = req.user.id;

  try {
    const account = await User.findOne({ where: { id: owner } });
    if (account) {
      const newInfo = await account.update({
        email,
        firstName,
        lastName,
        heightInInches,
        weightInPounds,
        age,
        isPremium,
        isCoach,
      });
      res.status(200).json({
        message: "Account Updated!",
        newInfo,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Server Error", err });
  }
});

/**************************
    UPDATE USER PASSWORD
**************************/
userController.put("/updatePassword", userValidation, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const owner = req.user.id;
  try {
    const account = await User.findOne({ where: { id: owner } });
    if (account) {
      bcrypt.compare(oldPassword, account.passwordhash, (err, matches) => {
        if (matches) {
          account.update({ passwordhash: bcrypt.hashSync(newPassword, 10) });
          res.status(200).json({
            message: "Password successfully updated!",
          });
        } else {
          res.status(403).send({ error: "Wrong password" });
        }
      });
    }
  } catch (err) {
    res.status(500).send({ error: "Server Error" });
  }
});

/**************************
    DELETE USER
**************************/
userController.delete("/removeUser", userValidation, async (req, res) => {
  const { password } = req.body;
  const owner = req.user.id;
  try {
    const account = await User.findOne({ where: { id: owner } });
    if (account) {
      bcrypt.compare(password, account.passwordhash, (err, matches) => {
        if (matches) {
          account.destroy();
          res.status(200).json({
            message: "Account removed",
          });
        } else {
          res.status(403).send({ error: "Wrong password" });
        }
      });
    }
  } catch (err) {
    res.status(500).send({ error: "Server Error" });
  }
});

module.exports = userController;
