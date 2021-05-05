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
const teamController = express_1.Router();
/****************************
    CREATE TEAM
****************************/
teamController.post("/create", middleware_1.userValidation, async (req, res, next) => {
    const info = req.body.info;
    const user = req.user;
    try {
        let [queryString, valArray] = getQueryArgsFn_1.default("insert", "teams", info);
        //Throw custom error if problem with query string.
        if (!queryString) {
            throw new models_1.CustomError(400, "Request failed. Data not created. Query parameters problem.");
        }
        //Send INSERT to DB
        const teamResults = await db_1.default.query(queryString, valArray);
        //Throw error if nothing returnd from DB
        if (teamResults.rowCount === 0) {
            throw new models_1.CustomError(400, "Request failed. User not created. DB Insertion problem.");
        }
        const newTeam = teamResults.rows[0];
        const rosterInfo = { role: "manager", teamId: newTeam.id, userId: user.id };
        const [rosterQueryString, rosterValArray] = getQueryArgsFn_1.default("insert", "teamRosters", rosterInfo);
        if (!rosterQueryString) {
            throw new models_1.CustomError(400, "Request failed. Data not created. Query parameters problem.");
        }
        const rosterResults = await db_1.default.query(rosterQueryString, rosterValArray);
        if (rosterResults.rowCount === 0) {
            throw new models_1.CustomError(400, "Request failed. User not created. DB Insertion problem.");
        }
        const newTeamRoster = rosterResults.rows[0];
        let updatedUser = user;
        if (!user.isCoach) {
            const userResults = await db_1.default.query("UPDATE users SET isCoach=true WEHRE id = $1", [user.id]);
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
exports.default = teamController;
