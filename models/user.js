const { DataTypes } = require("sequelize");
const sequelize = require("../db");
// const teamRosters = require("./teamRosters");

const User = sequelize.define("user", {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  passwordhash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  heightInInches: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  weightInPounds: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  isPremium: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  isCoach: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  fitbitRefresh: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = User;
