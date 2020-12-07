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
      res.status(200).json({
        message: `${teammate.firstName} was added to the team as a ${role}.`,
      });
    } else {
      res.status(403).json({ error: "Can't find that account." });
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
    if (err instanceof UniqueConstraintError) {
      res.status(409).json({
        message: `The name '${teamName}' is already taken.`,
      });
    } else {
      res.status(500).json({ error: "Server Error" });
    }
  }
});

/********************************
    UPDATE COACH OR MANAGER ROLE
 *******************************/
managerController.put("/updateCoach", async (req, res) => {
  const { userId, teamId, newRole } = req.body;
  try {
    const roleCount = await TeamRoster.findAll({
      where: { teamId, role: "manager" },
    });
    if (roleCount.length === 1 && newRole === "coach") {
      //Requires at least one manager be on the team
      res
        .status(405)
        .json({ message: "Must have atleast one manager on a team" });
    } else {
      const teamMember = await TeamRoster.findOne({
        where: { userId: userId, teamId: teamId },
      });
      const updatedTeamMember = await teamMember.update({ role: newRole });
      res.status(200).json({
        message: "Role Updated",
        updatedTeamMember,
      });
    }
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
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
