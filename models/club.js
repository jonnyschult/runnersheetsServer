const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Club = sequelize.define("club", {
  clubName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
});

module.exports = Club;
