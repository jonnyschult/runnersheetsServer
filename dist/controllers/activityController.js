"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const models_1 = require("../models");
const express_1 = require("express");
const middleware_1 = require("../middleware");
const db_1 = __importDefault(require("../db"));
const getQueryArgsFn_1 = __importDefault(require("../utilities/getQueryArgsFn"));
const activityController = express_1.Router();
/************************
 CREATE ACTIVITIY
************************/
activityController.post("/createActivity", middleware_1.userValidation, async (req, res) => {
    try {
        const info = req.body.info;
        const user = req.user;
        if (info.user_id !== user.id) {
            throw new models_1.CustomError(401, "Request failed. You can only create your own activities.");
        }
        const [queryString, valArray] = getQueryArgsFn_1.default("insert", "activities", info);
        //Send INSERT to DB
        const result = await db_1.default.query(queryString, valArray);
        const newActivity = result.rows[0];
        res.status(200).json({
            newActivity,
            message: "Activity saved.",
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
/************************
 GET ACTIVITIES
************************/
activityController.get("/getActivities", middleware_1.userValidation, async (req, res) => {
    try {
        const info = req.query;
        const user = req.user;
        console.log(info);
        //Throw error if user does not own the data.
        if (user.id !== info.user_id) {
            throw new models_1.CustomError(401, "Request failed. Can only retrieve your activities.");
        }
        //Utility function to get query arguments
        const [queryString, valArray] = getQueryArgsFn_1.default("select", "activities", info);
        res.status(200).json({
            message: "Success. Student assigned lesson.",
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
/************************
 GET ACTIVITIES BY DATE
************************/
activityController.get("/getActivitiesByDate", middleware_1.userValidation, async (req, res) => {
    try {
        const user = req.user;
        const startDate = req.query.start_date;
        const endDate = req.query.end_date;
        console.log(startDate, endDate);
        //Get data
        const results = await db_1.default.query("SELECT * FROM activities WHERE user_id = $1 AND (date >= $2 AND date <= $3);", [user.id, startDate, endDate]);
        const activities = results.rows;
        res.status(200).json({ message: "Activities retrieved", activities });
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
/************************
 UPDATE ACTIVITY
************************/
activityController.put("/updateActivity", middleware_1.userValidation, async (req, res) => {
    try {
        const info = req.body.info;
        const user = req.user;
        //Throw error if data doesn't belong to user
        if (user.id !== info.user_id) {
            throw new models_1.CustomError(401, "Request failed. Must be your own data.");
        }
        //Utility function to get the query params
        const [queryString, valArray] = getQueryArgsFn_1.default("update", "activities", info, +info.id);
        //Send update query to DB
        const result = await db_1.default.query(queryString, valArray);
        //Throw error if nothing is returned
        if (result.rowCount == 0) {
            throw new models_1.CustomError(404, "Request failed. Update query problem.");
        }
        //Variable for return data
        const updatedActivity = result.rows[0];
        res.status(200).json({ message: "Activity updated.", updatedActivity });
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
/************************
 DELETE ACTIVITIY
************************/
activityController.delete("/removeActivity/:id", middleware_1.userValidation, async (req, res) => {
    try {
        const user = req.user;
        const activity_id = req.params.id;
        //Get data for security check
        const activityResults = await db_1.default.query("SELECT * FROM activities WHERE id = $1", [activity_id]);
        const activity = activityResults.rows[0];
        //Throw error if not user's data
        if (activity.user_id !== user.id) {
            throw new models_1.CustomError(401, "Request failed. Can only delete your personal data.");
        }
        //Send DELETE query to DB
        const results = await db_1.default.query("DELETE FROM activities WHERE id = $1", [activity_id]);
        //Throw error if there is no return data
        if (results.rowCount == 0) {
            throw new models_1.CustomError(404, "Request failed. Update query problem.");
        }
        res.status(200).json({ message: "Activity Deleted" });
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
exports.default = activityController;
