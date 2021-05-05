"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const express_1 = require("express");
const viceChairController = express_1.Router();
/***********************
    ADD CLUB ATHLETE
***********************/
viceChairController.post("/addAthlete", async (req, res) => {
    const { clubAthleteEmail, clubId } = req.body;
    try {
        const athlete = await models_1.User.findOne({ where: { email: clubAthleteEmail } }); //Find userId for new club member by email address.
        if (athlete) {
            await models_1.ClubRoster.create({
                role: "athlete",
                clubId,
                userId: athlete.id,
            });
            res.status(200).json({
                message: `${athlete.firstName} was added to the club as a member.`,
            });
        }
        else {
            res.status(403).json({ message: "Can't find that account." });
        }
    }
    catch (err) {
        if (err instanceof UniqueConstraintError) {
            res.status(409).json({
                message: `${clubAthleteEmail} is already on the club`,
            });
        }
        res.status(500).json({ message: "server error", err });
    }
});
/**************************
    DELETE ATHLETE
**************************/
viceChairController.delete("/removeAthlete", async (req, res) => {
    const { athleteId, clubId } = req.body;
    try {
        const athlete = await models_1.ClubRoster.findOne({
            //Finds athlete and requires their role to be "athlete".
            where: { clubId: clubId, userId: athleteId, role: "athlete" },
        });
        const removed = await athlete.destroy(); //Removes that athlete from the table.
        res.status(200).json({
            message: `Athlete removed from club.`,
            removed,
        });
    }
    catch (err) {
        res.status(500).json({
            message: "Error. Athlete failed to be removed.",
            err,
        });
    }
});
exports.default = viceChairController;
