const { TeamRoster, User, Team } = require("../models");
const { Router } = require("express");
const sequelize = require("../db");
const coachController = Router();
const { UniqueConstraintError } = require("sequelize");

/***********************
    ADD TEAM MEMBER
***********************/
coachController.post("/addAthlete", async (req, res) => {
  const { teammateEmail, teamId } = req.body;
  try {
    const teammate = await User.findOne({ where: { email: teammateEmail } }); //Find userId for new teammate by email address.
    if (teammate) {
      await TeamRoster.create({
        role: "athlete",
        teamId,
        userId: teammate.id,
      });
      res.status(200).send({
        message: `${teammate.firstName} was added to the team as an athlete.`,
      });
    } else {
      res.status(403).send({ error: "Can't find that account." });
    }
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      res.status(409).json({
        message: `${teammateEmail} is already on the team`,
      });
    }
    res.status(500).send({ error: "server error", err });
  }
});

/**************************
    GET ATHLETES
**************************/
coachController.get("/getAthletes/:id", async (req, res) => {
  const teamId = req.params.id;
  try {
    const teamInfo = await TeamRoster.findAll({
      where: { teamId: teamId, role: "athlete" },
    });
    const atheleteUserIds = teamInfo.map((athlete) => {
      return athlete.userId;
    });
    const athleteInfo = await User.findAll({
      where: { id: atheleteUserIds },
    });
    res.status(200).json({
      message: "Success",
      teamInfo,
      athleteInfo,
    });
  } catch (err) {
    res.status(500).send({ error: "Server Error" });
  }
});

/**************************
    GET TEAM ACTIVITIES
**************************/
coachController.get("/getTeamActivities/:id", async (req, res) => {
  const teamId = req.params.id;
  try {
    const teamInfo = await TeamRoster.findAll({
      //Finds all team athletes
      where: { teamId: teamId, role: "athlete" },
    });
    const atheleteUserIds = teamInfo.map((athlete) => {
      //Maps athelete id into a new array
      return athlete.userId;
    });
    const teamActivities = await User.findAll({
      //Finds all athletes' activities using the ids from the map method above.
      where: { id: atheleteUserIds },
      include: "activities",
    });
    res.status(200).json({
      message: "Success",
      teamInfo,
      teamActivities,
    });
  } catch (err) {
    res.status(500).send({ error: "Server Error" });
  }
});

/**************************
    GET ATHLETE ACTIVITIES
**************************/
coachController.get("/getAthleteActivities/:id", async (req, res) => {
  const athleteId = req.params.id;
  try {
    const athleteActivities = await User.findOne({
      where: { id: athleteId },
      include: "activities",
    });
    res.status(200).json({
      message: "Success",
      athleteActivities,
    });
  } catch (err) {
    res.status(500).send({ error: "Server Error" });
  }
});

/**************************
    DELETE ATHLETE
**************************/
coachController.delete("/removeAthlete", async (req, res) => {
  const { athleteId, teamId } = req.body;
  try {
    const athlete = await TeamRoster.findOne({
      //Finds athlete and requires their role to be "athlete".
      where: { teamId: teamId, userId: athleteId, role: "athlete" },
    });
    const removed = await athlete.destroy(); //Removes that athlete from the table.
    res.status(200).json({
      message: `Athlete removed from team.`,
      removed,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error. Athlete failed to be removed.",
      err,
    });
  }
});

module.exports = coachController;
