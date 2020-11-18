const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Activity = sequelize.define("activity", {
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  meters: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  durationSecs: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  elevationMeters: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  avgHR: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  maxHR: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  strava_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

module.exports = Activity;
