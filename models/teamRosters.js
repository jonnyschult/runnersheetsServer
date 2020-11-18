const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const TeamRosters = sequelize.define("teamRosters", {
  role: {
    type: DataTypes.ENUM("athlete", "coach", "manager"),
    allowNull: false,
  },
});

module.exports = TeamRosters;
