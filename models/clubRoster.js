const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const ClubRoster = sequelize.define("clubRoster", {
  role: {
    type: DataTypes.ENUM("athlete", "vice chairperson", "chairperson"),
    allowNull: false,
  },
});

module.exports = ClubRoster;
