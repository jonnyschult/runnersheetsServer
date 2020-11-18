const { Activity, Team, TeamRoster, User } = require("../models");
const { Router } = require("express");
const sequelize = require("../db");
const managerController = Router();
const { UniqueConstraintError, Op } = require("sequelize");

/********************************
    ADD COACH OR MANAGER
 *******************************/
managerController.post("/addCoach", async (req, res) => {
  const { teammateEmail, teamId, role } = req.body;
  try {
    const teammate = await User.findOne({ where: { email: teammateEmail } }); //Find userId for new teammate by email address.
    if (teammate) {
      await TeamRoster.create({
        role,
        teamId,
        userId: teammate.id,
      });
      res.status(200).send({
        message: `${teammate.firstName} was added to the team as a ${role}.`,
      });
    } else {
      res.status(403).send({ error: "Can't find that account." });
    }
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      res.status(409).json({
        message: `${teammateEmail} is already on the team`,
      });
    } else {
      res.status(500).json({
        message: "server error",
        error: err,
      });
    }
  }
});

/**************************
    GET COACHES
**************************/
managerController.get("/getCoaches/:id", async (req, res) => {
  const teamId = req.params.id;
  try {
    const teamCoaches = await TeamRoster.findAll({
      where: { teamId: teamId, role: { [Op.or]: ["manager", "coach"] } },
    });
    const coaches = teamCoaches.map((athlete) => {
      return athlete.userId;
    });
    const coachInfo = await User.findAll({
      where: { id: coaches },
    });
    res.status(200).json({
      message: "Success",
      coachInfo,
    });
  } catch (err) {
    res.status(500).send({ error: "Server Error" });
  }
});

/**************************
    UPDATE TEAM NAME
**************************/
managerController.put("/updateTeam", async (req, res) => {
  const { newTeamName, teamId } = req.body;
  try {
    const team = await Team.findOne({ where: { id: teamId } });
    const updatedTeam = await team.update({ teamName: newTeamName });
    res.status(200).json({
      message: "Name updated!",
      updatedTeam,
    });
  } catch (err) {
    res.status(500).send({ error: "Server Error" });
  }
});

/********************************
    UPDATE COACH OR MANAGER ROLE
 *******************************/
managerController.put("/updateCoach", async (req, res) => {
  const { userId, teamId, newRole } = req.body;
  try {
    const teamMember = await TeamRoster.findOne({
      where: { userId: userId, teamId: teamId },
    });
    const updatedTeamMember = await teamMember.update({ role: newRole });
    res.status(200).json({
      message: "Role Updated",
      updatedTeamMember,
    });
  } catch (err) {
    res.status(500).send({ error: "Server Error" });
  }
});

/**************************
    DELETE TEAM MEMBER
**************************/
managerController.delete("/removeCoach", async (req, res) => {
  const { coachId, teamId } = req.body;
  try {
    const coach = await TeamRoster.findOne({
      where: { teamId: teamId, userId: coachId },
    });
    const removed = await coach.destroy();
    res.status(200).json({
      message: `Coach removed from team.`,
      removed,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error. Coach failed to be removed.",
      err,
    });
  }
});

/**************************
    DELETE TEAM 
**************************/
managerController.delete("/removeTeam", async (req, res) => {
  const { teamId } = req.body;
  try {
    const team = await Team.findOne({
      where: { id: teamId },
    });
    await team.destroy();
    res.status(200).json({
      message: `Team Removed`,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error. Team failed to delete.",
      err,
    });
  }
});

module.exports = managerController;
