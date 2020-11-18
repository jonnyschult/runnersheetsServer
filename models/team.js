const { DataTypes } = require("sequelize");
const sequelize = require("../db");
// const teamRosters = require("./teamRosters");

const Team = sequelize.define("team", {
  teamName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
});

module.exports = Team;
