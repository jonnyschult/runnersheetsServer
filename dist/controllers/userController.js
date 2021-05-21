"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const models_1 = require("../models/");
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const middleware_1 = require("../middleware");
const db_1 = __importDefault(require("../db"));
const getQueryArgsFn_1 = __importDefault(require("../utilities/getQueryArgsFn"));
const userController = express_1.Router();
/***************************
 * USER REGISTER
 ***************************/
userController.post("/register", async (req, res) => {
    const info = req.body.info;
    try {
        if (info.password.length < 8) {
            throw new models_1.CustomError(406, "Password less than 8 characters long");
        }
        const passwordhash = bcrypt_1.default.hashSync(info.password, 10);
        delete info.password;
        info.passwordhash = passwordhash;
        // utility function to generate query parameters
        const [queryString, valArray] = getQueryArgsFn_1.default("insert", "users", info);
        //Send INSERT to users table in DB
        const result = await db_1.default.query(queryString, valArray);
        //assign varraible for return data
        const newUser = result.rows[0];
        //jwt sign id to create token
        const token = await jsonwebtoken_1.default.sign({ id: newUser.id }, process.env.JWT_SECRET, {
            expiresIn: "1d",
        });
        //Deletes passwordhash to prevent sending back sensitive info
        delete newUser.passwordhash;
        res.status(200).json({ message: "User Created", token, user: newUser });
    }
    catch (error) {
        console.log(error);
        if (error.status < 500) {
            res.status(error.status).json({ message: error.message });
        }
        else if (error.constraint === "users_email_key") {
            //bit hacky, but sends unique error back which is easier to catch on the front end.
            res.status(409).json({ message: "User already exists", error });
        }
        else {
            res.status(500).json({ message: "Internal server error", error });
        }
    }
});
/***************************
 * USER LOGIN
 ***************************/
userController.post("/login", async (req, res) => {
    try {
        //user is of type User defined in the models
        const info = req.body.info;
        //Send email to get user info from users table in DB
        const result = await db_1.default.query("SELECT * FROM users WHERE email = $1", [info.email]); //Get query results
        //Throw error if the result didn't yield anything
        if (result.rowCount === 0) {
            throw new models_1.CustomError(404, "Request failed. Couldn't find user");
        }
        //Set variable for return info
        const queryUser = result.rows[0]; //Set queryUser as the result of the query to the users table.
        //Returns a boolean predicated on the matching of the passwords
        const validPass = await bcrypt_1.default.compare(info.password, queryUser.passwordhash);
        //Throw error if the passwords don't match.
        if (!validPass) {
            throw new models_1.CustomError(400, "Request failed. Wrong password.");
        }
        //Create token for user id
        const token = await jsonwebtoken_1.default.sign({ id: queryUser.id }, process.env.JWT_SECRET, {
            expiresIn: "1d",
        });
        //Delete sensitive information so as to not send it back.
        delete queryUser.passwordhash;
        res.status(200).json({
            message: "Successfully Logged in!",
            user: queryUser,
            token,
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
    GET USER
**************************/
userController.get("/getUser", middleware_1.userValidation, async (req, res) => {
    try {
        //get user from validation session
        const user = req.user;
        //Delete all password hashes for return data
        delete user.passwordhash;
        const startDate = new Date().getTime() - 604800000;
        const endDate = new Date().getTime();
        const teamsResults = await db_1.default.query("SELECT * FROM teams INNER JOIN teams_users ON teams.id = teams_users.team_id WHERE teams_users.user_id = $1;", [user.id]);
        const clubsResults = await db_1.default.query("SELECT * FROM clubs INNER JOIN clubs_users ON clubs.id = clubs_users.club_id WHERE clubs_users.user_id = $1;", [user.id]);
        const activitiesResults = await db_1.default.query("SELECT * FROM activities WHERE user_id = $1 AND (date >= $2 AND date <= $3);", [user.id, startDate, endDate]);
        const teamsUsersResults = await db_1.default.query("SELECT * FROM teams_users WHERE user_id = $1;", [user.id]);
        const clubsUsersResults = await db_1.default.query("SELECT * FROM clubs_users WHERE user_id = $1;", [user.id]);
        const clubsUsers = clubsUsersResults.rows;
        const teamsUsers = teamsUsersResults.rows;
        const teamsNoRoles = teamsResults.rows;
        const clubsNoRoles = clubsResults.rows;
        const teams = teamsNoRoles.map((team) => {
            teamsUsers.forEach((teamUser) => {
                if (teamUser.team_id === team.id) {
                    team.role = teamUser.role;
                    return team;
                }
            });
            return team;
        });
        const clubs = clubsNoRoles.map((club) => {
            clubsUsers.forEach((clubUser) => {
                if (clubUser.club_id === club.id) {
                    club.role = clubUser.role;
                    return club;
                }
            });
            return club;
        });
        console.log(clubsNoRoles, clubs);
        const activities = activitiesResults.rows;
        //Responds with success message and the array of users
        res.status(200).json({ message: "Success", user, clubs, teams, activities });
    }
    catch (error) {
        console.log("In userController getUser", error);
        res.status(500).json({ message: "Internal server error", error });
    }
});
/**************************
    UPDATE USER INFO
**************************/
userController.put("/updateUser", middleware_1.userValidation, async (req, res) => {
    try {
        const info = req.body.info;
        const user = req.user;
        //Utility function to get query arguments
        const [queryString, valArray] = getQueryArgsFn_1.default("update", "users", info, +user.id);
        //Pass UPDATE to users table in DB
        const result = await db_1.default.query(queryString, valArray);
        const updatedUser = result.rows[0];
        res.status(200).json({ message: "Account Updated!", updatedUser });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error", error });
    }
});
/**************************
    UPDATE USER PASSWORD
**************************/
userController.put("/updatePassword", middleware_1.userValidation, // Validates user and gives us req.user property
async (req, res) => {
    try {
        //Get info to update from req.body
        const updateInfo = req.body.info;
        //Get user from validation session
        const user = req.user;
        //Pass UPDATE query to users table in DB
        const result = await db_1.default.query("SELECT * FROM users WHERE id = $1", [user.id]);
        //Throw error if nothing is returned
        if (result.rowCount === 0) {
            throw new models_1.CustomError(404, "Request failed. No such user found.");
        }
        //Set variable for return data
        const queryUser = result.rows[0];
        //bcrypt.compare returns a boolean. False if the passwords don't match
        const validPass = await bcrypt_1.default.compare(updateInfo.oldPassword, queryUser.passwordhash);
        //Throw error if the password is invalid.
        if (!validPass) {
            throw new models_1.CustomError(400, "Request failed. Wrong password.");
        }
        //Hash password before saving to db
        const passwordhash = bcrypt_1.default.hashSync(updateInfo.newPassword, 10);
        //save hashed password
        await db_1.default.query("UPDATE users SET passwordhash = $1", [passwordhash]);
        res.status(200).json({ message: "Password Updated" });
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
    DELETE USER
**************************/
userController.delete("/deleteUser/:id", middleware_1.userValidation, // Validates user and gives us req.user property
async (req, res) => {
    try {
        //Id of user to delete
        const idToRemove = +req.params.id;
        //Get user set in validation session
        const user = req.user;
        //Throw an error if user is not deleting themselves
        if (idToRemove !== user.id) {
            throw new models_1.CustomError(401, "User not deleted. Need to be logged in as user or admin");
        }
        //Send DELETE query to users table in DB
        await db_1.default.query("DELETE FROM users WHERE id = $1", [idToRemove]);
        res.status(200).json({ message: "User Deleted" });
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
exports.default = userController;
