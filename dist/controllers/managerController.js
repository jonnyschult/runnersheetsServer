"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const express_1 = require("express");
const managerController = express_1.Router();
/********************************
    ADD COACH OR MANAGER
 *******************************/
managerController.post("/addCoach", async (req, res) => {
    const { teammateEmail, teamId, role } = req.body;
    try {
        const teammate = await models_1.User.findOne({ where: { email: teammateEmail } }); //Find userId for new teammate by email address.
        if (teammate) {
            await models_1.TeamRoster.create({
                role,
                teamId,
                userId: teammate.id,
            });
            res.status(200).json({
                message: `${teammate.firstName} was added to the team as a ${role}.`,
            });
        }
        else {
            res.status(403).json({ error: "Can't find that account." });
        }
    }
    catch (err) {
        if (err instanceof UniqueConstraintError) {
            res.status(409).json({
                message: `${teammateEmail} is already on the team`,
            });
        }
        else {
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
        const team = await models_1.Team.findOne({ where: { id: teamId } });
        const updatedTeam = await team.update({ teamName: newTeamName });
        res.status(200).json({
            message: "Name updated!",
            updatedTeam,
        });
    }
    catch (err) {
        if (err instanceof UniqueConstraintError) {
            res.status(409).json({
                message: `The name '${teamName}' is already taken.`,
            });
        }
        else {
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
        const roleCount = await models_1.TeamRoster.findAll({
            where: { teamId, role: "manager" },
        });
        if (roleCount.length === 1 && newRole === "coach") {
            //Requires at least one manager be on the team
            res
                .status(405)
                .json({ message: "Must have atleast one manager on a team" });
        }
        else {
            const teamMember = await models_1.TeamRoster.findOne({
                where: { userId: userId, teamId: teamId },
            });
            const updatedTeamMember = await teamMember.update({ role: newRole });
            res.status(200).json({
                message: "Role Updated",
                updatedTeamMember,
            });
        }
    }
    catch (err) {
        res.status(500).json({ error: "Server Error" });
    }
});
/**************************
    DELETE TEAM MEMBER
**************************/
managerController.delete("/removeCoach", async (req, res) => {
    const { coachId, teamId } = req.body;
    try {
        const coach = await models_1.TeamRoster.findOne({
            where: { teamId: teamId, userId: coachId },
        });
        const removed = await coach.destroy();
        res.status(200).json({
            message: `Coach removed from team.`,
            removed,
        });
    }
    catch (err) {
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
        const team = await models_1.Team.findOne({
            where: { id: teamId },
        });
        await team.destroy();
        res.status(200).json({
            message: `Team Removed`,
        });
    }
    catch (err) {
        res.status(500).json({
            message: "Error. Team failed to delete.",
            err,
        });
    }
});
exports.default = managerController;
