"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const express_1 = require("express");
const middleware_1 = require("../middleware");
const db_1 = __importDefault(require("../db"));
const getQueryArgsFn_1 = __importDefault(require("../utilities/getQueryArgsFn"));
const roleValidator_1 = __importDefault(require("../utilities/roleValidator"));
const teamController = express_1.Router();
/****************************
    CREATE TEAM
****************************/
teamController.post("/create", middleware_1.userValidation, async (req, res, next) => {
    try {
        const info = req.body.info;
        const user = req.user;
        let [queryString, valArray] = getQueryArgsFn_1.default("insert", "teams", info);
        //Throw custom error if problem with query string.
        if (!queryString) {
            throw new models_1.CustomError(400, "Request failed. Data not created. Query parameters problem.");
        }
        //Send INSERT to DB
        const teamResults = await db_1.default.query(queryString, valArray);
        //Throw error if nothing returnd from DB
        const newTeam = teamResults.rows[0];
        //add manager who created team.
        const teamsUsersInfo = { role: "manager", team_id: newTeam.id, user_id: user.id };
        const [teamsUsersQuery, teamsUsersArray] = getQueryArgsFn_1.default("insert", "teams_users", teamsUsersInfo);
        if (!teamsUsersQuery) {
            throw new models_1.CustomError(400, "Request failed. Data not created. Query parameters problem.");
        }
        const teamsUsersResults = await db_1.default.query(teamsUsersQuery, teamsUsersArray);
        const newTeamRoster = teamsUsersResults.rows[0];
        let updatedUser = user;
        if (!user.coach) {
            const userResults = await db_1.default.query("UPDATE users SET coach = true WEHRE id = $1", [user.id]);
            updatedUser = userResults.rows[0];
        }
        res.status(200).json({ message: "Team Created", newTeam, newTeamRoster, updatedUser });
    }
    catch (error) {
        console.log(error);
        if (error.status < 500) {
            res.status(error.status).json({ message: error.message });
        }
        else {
            res.status(500).json({ message: "Internal server error", error });
        }
    }
});
/***********************
    ADD TEAM ATHLETE
***********************/
teamController.post("/addAthlete", middleware_1.userValidation, async (req, res) => {
    try {
        const info = req.body.info;
        const user = req.user;
        //checks that updater is coach or manager on team, if not, throws error.
        await roleValidator_1.default(user.id, info.team_id, ["manager", "coach"], "teams_users");
        //finds user by email.
        const teamMemberResults = await db_1.default.query("SELECT * FROM users WHERE email = $1", [info.email]);
        if (teamMemberResults.rowCount === 0) {
            throw new models_1.CustomError(404, "Request failed. Athlete not found.");
        }
        const teamMember = teamMemberResults.rows[0];
        //adds found user to team.
        const queryInfo = { role: "athlete", team_id: info.team_id, user_id: teamMember.id };
        const [queryString, valArray] = getQueryArgsFn_1.default("insert", "teams_users", queryInfo);
        if (!queryString) {
            throw new models_1.CustomError(400, "Request failed. Data not created. Query parameters problem.");
        }
        const teamRosterResults = await db_1.default.query(queryString, valArray);
        const newRosterEntry = teamRosterResults.rows[0];
        res.status(200).json({ message: "Athlete added to team", teamMember, newRosterEntry });
    }
    catch (error) {
        console.log(error);
        if (error.status < 500) {
            res.status(error.status).json({ message: error.message });
        }
        else {
            res.status(500).json({ message: "Internal server error", error });
        }
    }
});
/********************************
    ADD COACH OR MANAGER
 *******************************/
teamController.post("/addCoach", middleware_1.userValidation, async (req, res) => {
    try {
        const info = req.body.info;
        const user = req.user;
        //checks that updater is coach or manager on team, if not, throws error.
        await roleValidator_1.default(user.id, info.team_id, ["manager"], "teams_users");
        //finds user by email.
        const teamMemberResults = await db_1.default.query("SELECT * FROM users WHERE email = $1", [info.email]);
        if (teamMemberResults.rowCount === 0) {
            throw new models_1.CustomError(404, "Request failed. User not found.");
        }
        const teamMember = teamMemberResults.rows[0];
        //adds found user to team.
        const queryInfo = { role: info.role, team_id: info.team_id, user_id: teamMember.id };
        const [queryString, valArray] = getQueryArgsFn_1.default("insert", "teams_users", queryInfo);
        if (!queryString) {
            throw new models_1.CustomError(400, "Request failed. Data not created. Query parameters problem.");
        }
        const teamRosterResults = await db_1.default.query(queryString, valArray);
        const teamsUsersInfo = teamRosterResults.rows[0];
        res.status(200).json({
            message: `${teamMember.first_name} was added to the team as a ${teamsUsersInfo.role}.`,
            teamMember,
            teamsUsersInfo,
        });
    }
    catch (error) {
        console.log(error);
        if (error.status < 500) {
            res.status(error.status).json({ message: error.message });
        }
        else {
            res.status(500).json({ message: "Internal server error", error });
        }
    }
});
/**************************
    GET TEAM MEMBERS
**************************/
teamController.get("/getTeam/:id", middleware_1.userValidation, async (req, res) => {
    try {
        const team_id = +req.params.id;
        const user = req.user;
        //checks that updater is coach or manager on team, if not, throws error.
        await roleValidator_1.default(user.id, team_id, ["manager", "coach"], "teams_users");
        const athletesResults = await db_1.default.query("SELECT * FROM users INNER JOIN teams_users ON users.id = teams_users.user_id WHERE teams_users.team_id = $1 AND teams_users.role = $2;", [team_id, "athlete"]);
        const coachesResults = await db_1.default.query("SELECT * FROM users INNER JOIN teams_users ON users.id = teams_users.user_id WHERE teams_users.team_id = $1 AND teams_users.role = $2;", [team_id, "coach"]);
        const managersResults = await db_1.default.query("SELECT * FROM users INNER JOIN teams_users ON users.id = teams_users.user_id WHERE teams_users.team_id = $1 AND teams_users.role = $2;", [team_id, "manager"]);
        const athletes = athletesResults.rows;
        const coaches = coachesResults.rows;
        const managers = managersResults.rows;
        res.status(200).json({ message: "Success", athletes, coaches, managers });
    }
    catch (error) {
        console.log(error);
        if (error.status < 500) {
            res.status(error.status).json({ message: error.message });
        }
        else {
            res.status(500).json({ message: "Internal server error", error });
        }
    }
});
/**************************
    GET TEAMS
**************************/
teamController.get("/coachTeams", middleware_1.userValidation, async (req, res) => {
    try {
        const user = req.user;
        if (!user.coach) {
            throw new models_1.CustomError(401, "Must be a coach or manager to receive this data");
        }
        const teamsResults = await db_1.default.query("SELECT * FROM teams INNER JOIN teams_users ON teams.id = teams_users.teams_id WHERE (teams_users.id = $1 AND teams_users.role = $1) OR (teams_users.id = $1 AND teams_users.role =$2);", [user.id, "coach", "manager"]);
        const teams = teamsResults.rows;
        res.status(200).json({ message: "Success", teams });
    }
    catch (error) {
        console.log(error);
        if (error.status < 500) {
            res.status(error.status).json({ message: error.message });
        }
        else {
            res.status(500).json({ message: "Internal server error", error });
        }
    }
});
/**************************
    GET TEAM ACTIVITIES
**************************/
teamController.get("/getTeamActivities/:id", middleware_1.userValidation, async (req, res) => {
    try {
        const team_id = +req.params.id;
        const info = req.query;
        const user = req.user;
        //checks that updater is coach or manager on team, if not, throws error.
        await roleValidator_1.default(user.id, team_id, ["manager", "coach"], "teams_users");
        //gets all athletes
        const results = await db_1.default.query("SELECT * FROM users INNER JOIN teams_users ON users.id = teams_users.user_id WHERE teams_users.team_id = $1 AND teams_users.role = $2;", [team_id, "athlete"]);
        const athleteIds = results.rows.map((athlete) => athlete.id);
        //gets activities for each athlete using their ids.
        const activities = athleteIds.map((num) => {
            db_1.default.query("SELECT * FROM activities WHERE user_id = $1 AND (date >= $2::DATE AND date <= $3::DATE)", [
                num,
                info.start_date,
                info.end_date,
            ]);
        });
        res.status(200).json({ message: "Success", activities });
    }
    catch (error) {
        console.log(error);
        if (error.status < 500) {
            res.status(error.status).json({ message: error.message });
        }
        else {
            res.status(500).json({ message: "Internal server error", error });
        }
    }
});
/**************************
    UPDATE ATHLETE INFO
**************************/
teamController.put("/updateAthlete", middleware_1.userValidation, async (req, res) => {
    try {
        const info = req.body.info;
        const team_id = req.body.team_id;
        const user = req.user;
        //checks that updater is coach or manager on team, if not, throws error.
        await roleValidator_1.default(user.id, team_id, ["manager", "coach"], "teams_users");
        //checks that updatee is athlete on team
        await roleValidator_1.default(info.id, team_id, ["athlete"], "teams_users");
        //Utility function to get query arguments
        const [queryString, valArray] = getQueryArgsFn_1.default("update", "users", info, info.id);
        //If blank string, throw error
        if (!queryString) {
            throw new models_1.CustomError(400, "Request failed. Info not updated. Query parameters problem.");
        }
        //Pass UPDATE to users table in DB
        const result = await db_1.default.query(queryString, valArray);
        const updatedUser = result.rows[0];
        res.status(200).json({ message: "Account Updated!", updatedUser });
    }
    catch (error) {
        console.log(error);
        if (error.status < 500) {
            res.status(error.status).json({ message: error.message });
        }
        else {
            res.status(500).json({ message: "Internal server error", error });
        }
    }
});
/**************************
    UPDATE TEAM NAME
**************************/
teamController.put("/updateTeam", middleware_1.userValidation, async (req, res) => {
    try {
        const info = req.body.info;
        const user = req.user;
        await roleValidator_1.default(user.id, info.id, ["manager"], "teams_users");
        //Utility function to get query arguments
        const [queryString, valArray] = getQueryArgsFn_1.default("update", "teams", info, info.id);
        //If blank string, throw error
        if (!queryString) {
            throw new models_1.CustomError(400, "Request failed. Info not updated. Query parameters problem.");
        }
        //Pass UPDATE to users table in DB
        const result = await db_1.default.query(queryString, valArray);
        const updatedTeam = result.rows[0];
        res.status(200).json({ message: "Name updated!", updatedTeam });
    }
    catch (error) {
        console.log(error);
        if (error.status < 500) {
            res.status(error.status).json({ message: error.message });
        }
        else {
            res.status(500).json({ message: "Internal server error", error });
        }
    }
});
/********************************
    UPDATE COACH OR MANAGER ROLE
 *******************************/
teamController.put("/updateCoach", middleware_1.userValidation, async (req, res) => {
    try {
        const info = req.body.info;
        const user = req.user;
        //checks that updater is coach or manager on team, if not, throws error.
        await roleValidator_1.default(user.id, info.team_id, ["manager"], "teams_users");
        //Utility function to get query arguments
        const [queryString, valArray] = getQueryArgsFn_1.default("update", "teams_users", info, info.id);
        //If blank string, throw error
        if (!queryString) {
            throw new models_1.CustomError(400, "Request failed. Info not updated. Query parameters problem.");
        }
        //Pass UPDATE to DB
        const result = await db_1.default.query(queryString, valArray);
        const updatedTeamMember = result.rows[0];
        res.status(200).json({
            message: "Role Updated",
            updatedTeamMember,
        });
    }
    catch (error) {
        console.log(error);
        if (error.status < 500) {
            res.status(error.status).json({ message: error.message });
        }
        else {
            res.status(500).json({ message: "Internal server error", error });
        }
    }
});
/**************************
    DELETE COACH OR MANAGER
**************************/
teamController.delete("/removeCoach", middleware_1.userValidation, async (req, res) => {
    try {
        const info = req.query;
        const user = req.user;
        //checks that updater is coach or manager on team, if not, throws error.
        await roleValidator_1.default(user.id, +info.team_id, ["manager"], "teams_users");
        //Send DELETE query to users table in DB
        const removed = await db_1.default.query("DELETE FROM teams_users WHERE team_id = $1 AND user_id = $2", [
            info.team_id,
            info.athlete_id,
        ]);
        res.status(200).json({ message: `Coach removed from team.`, removed });
    }
    catch (err) {
        res.status(500).json({
            message: "Error. Coach failed to be removed.",
            err,
        });
    }
});
/**************************
    DELETE ATHLETE
**************************/
teamController.delete("/removeAthlete", middleware_1.userValidation, async (req, res) => {
    try {
        const info = req.query;
        const user = req.user;
        await roleValidator_1.default(user.id, +info.team_id, ["manager", "coach"], "teams_users");
        //Send DELETE query to users table in DB
        const removed = await db_1.default.query("DELETE FROM teams_users WHERE team_id = $1 AND user_id = $2", [
            info.team_id,
            info.athlete_id,
        ]);
        res.status(200).json({
            message: `Athlete removed from team.`,
            removed,
        });
    }
    catch (error) {
        console.log(error);
        if (error.status < 500) {
            res.status(error.status).json({ message: error.message });
        }
        else {
            res.status(500).json({ message: "Internal server error", error });
        }
    }
});
/**************************
    DELETE TEAM
**************************/
teamController.delete("/removeTeam", middleware_1.userValidation, async (req, res) => {
    try {
        const info = req.query;
        const user = req.user;
        await roleValidator_1.default(user.id, +info.team_id, ["manager"], "teams_users");
        //Gets all coaches and managers associated with a team
        let updatedUser = user;
        const coachesManagersResults = await db_1.default.query("SELECT * FROM users INNER JOIN teams_users ON users.id = teams_users.user_id WHERE teams_users.team_id = $1 AND (teams_users.role = $2 OR teams_users.role = $3);", [info.team_id, "coach", "manager"]);
        const coachesManagers = coachesManagersResults.rows;
        //Send DELETE query to users table in DB
        const removed = await db_1.default.query("DELETE FROM teams WHERE id = $1", [info.team_id]);
        //Updates user's coach status if the removed team was their only team.
        coachesManagers.forEach(async (coachMang) => {
            const results = await db_1.default.query("SELECT * FROM teams_users WHERE user_id = $1;", [coachMang.id]);
            if (results.rowCount === 0) {
                const userUpdateResults = await db_1.default.query("UPDATE users SET coach = false WHERE id = $1;", [
                    coachMang.id,
                ]);
                if (coachMang.id === user.id) {
                    updatedUser = userUpdateResults.rows[0];
                }
            }
        });
        res.status(200).json({ message: `Team Removed`, removed });
    }
    catch (err) {
        res.status(500).json({
            message: "Error. Team failed to delete.",
            err,
        });
    }
});
exports.default = teamController;
