const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Activity = sequelize.define("activity", {
  date: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  meters: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  durationSecs: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  elevationMeters: {
    type: DataTypes.FLOAT,
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
  stravaId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  garminId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  fitbitId: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
});

module.exports = Activity;
