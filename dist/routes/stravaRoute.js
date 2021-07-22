"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const middleware_1 = require("../middleware");
const express_1 = require("express");
const stravaRouter = express_1.Router();
/***************************
 * GET CLIENT_ID AND CALLBACK URI FOR AUTHFLOW WITH STRAVA
 ***************************/
stravaRouter.get("/getData", middleware_1.userValidation, async (_, res) => {
    try {
        res.status(200).json({
            message: "success",
            stravaID: process.env.STRAVA_ID,
            stravaSecret: process.env.STRAVA_SECRET,
            redirectURI: process.env.STRAVA_CALLBACK,
        });
    }
    catch (err) {
        res.status(500).json({ err, message: "Server Error" });
    }
});
stravaRouter.post("/createRefresh", async (req, res) => {
    try {
        const info = req.body.info;
        const response = await fetch(`https://www.strava.com/oauth/token?client_id=${process.env.STRAVA_ID}&client_secret=${process.env.STRAVA_SECRETE}&code=${info.authCode}&grant_type=authorization_code`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
        const data = await response.json();
        console.log(data);
        res.status(200).json({ message: "Success" });
    }
    catch (error) {
        console.log("Error in strava get confirmation route", error);
        if (error.status < 500) {
            res.status(error.status).json({ message: error.message });
        }
        else {
            res.status(500).json({ message: "Internal server error", error });
        }
    }
});
exports.default = stravaRouter;
