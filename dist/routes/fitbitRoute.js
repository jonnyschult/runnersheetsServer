"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const express_1 = require("express");
const fitbitController = express_1.Router();
//TODO Redundant: Move to one route and return all info.
/***************************
 * GET CLIENT_ID AND CALLBACK URI FOR AUTHFLOW WITH FITBIT
 ***************************/
fitbitController.get("/getAuth", async (req, res) => {
    try {
        res.status(200).json({
            message: "success",
            clientId: process.env.FITBIT_CLIENT_ID,
            redirectURI: process.env.FITBIT_CALLBACK,
        });
    }
    catch (err) {
        res.status(500).json({ err, message: "Server Error" });
    }
});
/***************************
 * GET CLIENT_ID AND CLIENT_SECRET
 ***************************/
fitbitController.get("/getSecretId", async (req, res) => {
    try {
        res.status(200).json({
            message: "success",
            authorization: process.env.FITBIT_BASE64,
            redirectURI: process.env.FITBIT_CALLBACK,
        });
    }
    catch (err) {
        res.status(500).json({ err, message: "Server Error" });
    }
});
exports.default = fitbitController;
