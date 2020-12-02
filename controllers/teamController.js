const { Team, TeamRoster, User } = require("../models");
const sequelize = require("../db");
const jwt = require("jsonwebtoken");
const { Router } = require("express");
const { UniqueConstraintError } = require("sequelize");

const teamController = Router();

/****************************
    CREATE TEAM
****************************/
teamController.post("/create", async (req, res, next) => {
  const teamName = req.body.teamName;
  const owner = req.user.id;
  try {
    const newTeam = await Team.create({
      //Creates team in teams table
      teamName,
    });

    const newTeamRoster = await TeamRoster.create({
      //Create association and role in teamRosters table
      role: "manager", //Creator of team is a default manager.
      teamId: newTeam.id,
      userId: owner,
    });

    const userCoachStatus = await User.update(
      //updates user isCoach attribute to true
      { isCoach: true },
      { where: { id: owner } }
    );

    res.status(200).json({
      result: { newTeam, newTeamRoster },
      message: "Team Created",
    });
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      res.status(409).json({
        message: `The name '${teamName}' is already taken.`,
      });
    } else {
      res.status(500).json({
        result: err,
        message: "Server Error",
      });
    }
  }
});

module.exports = teamController;
