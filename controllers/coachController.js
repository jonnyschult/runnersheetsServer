const { TeamRoster, User, Team, Activity } = require("../models");
const { Router } = require("express");
const sequelize = require("../db");
const coachController = Router();
const { UniqueConstraintError, Op } = require("sequelize");

/***********************
    ADD TEAM ATHLETE
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
      //Find all athletes on team by id
      where: { teamId: teamId, role: "athlete" },
    });
    const atheleteUserIds = teamInfo.map((athlete) => {
      //Map into an array athlete ids.
      return athlete.userId;
    });
    const athleteInfo = await User.findAll({
      //Use ids to find athletes in the user tables
      where: { id: atheleteUserIds },
    });
    res.status(200).json({
      message: "Success",
      teamInfo,
      athleteInfo,
    });
  } catch (err) {
    res.status(500).send({ message: "Server Error" });
  }
});

/**************************
    GET COACHES
**************************/
coachController.get("/getCoaches/:id", async (req, res) => {
  const teamId = req.params.id;
  try {
    const roles = await TeamRoster.findAll({
      where: { teamId: teamId, role: { [Op.or]: ["manager", "coach"] } },
    });
    const coachesId = roles.map((athlete) => {
      return athlete.userId;
    });
    const coaches = await User.findAll({
      where: { id: coachesId },
    });
    res.status(200).json({
      message: "Success",
      coaches,
      roles,
    });
  } catch (err) {
    res.status(500).send({ message: "Server Error" });
  }
});

/**************************
    GET TEAMS
**************************/
coachController.get("/coachTeams", async (req, res) => {
  const owner = req.user.id;
  try {
    const coachRole = await TeamRoster.findAll({
      //Find all teams associated with user on team by id
      where: { userId: owner, role: { [Op.or]: ["manager", "coach"] } },
    });
    const teamIds = coachRole.map((team) => {
      //Map into an array athlete ids.
      return team.teamId;
    });
    const teams = await Team.findAll({
      //Use ids to find athletes in the user tables
      where: { id: teamIds },
    });
    res.status(200).json({
      message: "Success",
      coachRole,
      teams,
    });
  } catch (err) {
    res.status(500).send({ message: "Server Error" });
  }
});

/**************************
    GET TEAM ACTIVITIES
**************************/
coachController.get("/getTeamActivities/:id", async (req, res) => {
  const teamId = req.params.id;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
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
      include: [
        {
          model: Activity,
          where: { date: { [Op.between]: [startDate, endDate] } },
        },
      ],
    });
    res.status(200).json({
      message: "Success",
      teamInfo,
      teamActivities,
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", err });
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
    UPDATE ATHLETE INFO
**************************/
coachController.put("/updateAthlete", async (req, res) => {
  const { owner, heightInInches, weightInPounds, age } = req.body;

  try {
    const account = await User.findOne({ where: { id: owner } });
    if (account) {
      const newInfo = await account.update({
        heightInInches,
        weightInPounds,
        age,
      });
      res.status(200).json({
        message: "Account Updated!",
        newInfo,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ message: "Server Error", err });
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
