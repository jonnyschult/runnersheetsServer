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
const clubController = express_1.Router();
/****************************
    CREATE CLUB
****************************/
clubController.post("/create", middleware_1.userValidation, async (req, res) => {
    try {
        const info = req.body.clubName;
        const user = req.user;
        let [queryString, valArray] = getQueryArgsFn_1.default("insert", "clubs", info);
        //Throw custom error if problem with query string.
        if (!queryString) {
            throw new models_1.CustomError(400, "Request failed. Data not created. Query parameters problem.");
        }
        //Send INSERT to DB
        const clubResults = await db_1.default.query(queryString, valArray);
        //Throw error if nothing returnd from DB
        const newClub = clubResults.rows[0];
        //add chair who created club.
        const clubsUsersInfo = { role: "chair", club_id: newClub.id, user_id: user.id };
        const [clubsUsersQuery, clubsUsersArray] = getQueryArgsFn_1.default("insert", "clubs_users", clubsUsersInfo);
        if (!clubsUsersQuery) {
            throw new models_1.CustomError(400, "Request failed. Data not created. Query parameters problem.");
        }
        const clubsUsersResults = await db_1.default.query(clubsUsersQuery, clubsUsersArray);
        const newClubRoster = clubsUsersResults.rows[0];
        res.status(200).json({ newClub, newClubRoster, message: "Club Founded" });
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
    ADD CLUB ATHLETE
***********************/
clubController.post("/addAthlete", middleware_1.userValidation, async (req, res) => {
    try {
        const info = req.body.info;
        const user = req.user;
        //checks that updater is chair or vice_chair for club, if not, throws error.
        await roleValidator_1.default(user.id, info.club_id, ["chair", "vice_chair"], "clubs_users");
        //finds user by email.
        const clubMemberResults = await db_1.default.query("SELECT * FROM users WHERE email = $1", [info.email]);
        if (clubMemberResults.rowCount === 0) {
            throw new models_1.CustomError(404, "Request failed. Athlete not found.");
        }
        const clubMember = clubMemberResults.rows[0];
        //adds found user to club.
        const queryInfo = { role: "athlete", club_id: info.club_id, user_id: clubMember.id };
        const [queryString, valArray] = getQueryArgsFn_1.default("insert", "clubs_users", queryInfo);
        if (!queryString) {
            throw new models_1.CustomError(400, "Request failed. Data not created. Query parameters problem.");
        }
        const clubRosterResults = await db_1.default.query(queryString, valArray);
        const newRosterEntry = clubRosterResults.rows[0];
        res.status(200).json({
            message: `${clubMember.first_name} was added to the club as a member.`,
            newRosterEntry,
            clubMember,
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
/********************************
    ADD Chairperson
 *******************************/
clubController.post("/addChairperson", middleware_1.userValidation, async (req, res) => {
    try {
        const info = req.body.info;
        //finds user by email.
        const clubMemberResults = await db_1.default.query("SELECT * FROM users WHERE email = $1", [info.email]);
        if (clubMemberResults.rowCount === 0) {
            throw new models_1.CustomError(404, "Request failed. User not found.");
        }
        const clubMember = clubMemberResults.rows[0];
        //adds found user to club.
        const queryInfo = { role: info.role, club_id: info.club_id, user_id: clubMember.id };
        const [queryString, valArray] = getQueryArgsFn_1.default("insert", "clubs_users", queryInfo);
        if (!queryString) {
            throw new models_1.CustomError(400, "Request failed. Data not created. Query parameters problem.");
        }
        const clubRosterResults = await db_1.default.query(queryString, valArray);
        const newRosterEntry = clubRosterResults.rows[0];
        res.status(200).json({
            message: `${clubMember.first_name} was added to the club as a ${newRosterEntry.role}.`,
            newRosterEntry,
            clubMember,
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
// /**************************
//     GET ATHLETES
// **************************/
// clubController.get("/getAthletes/:id", async (req, res) => {
//   const clubId = req.params.id;
//   try {
//     const clubInfo = await ClubRoster.findAll({
//       //Find all athlete in club by id
//       where: { clubId: clubId, role: "athlete" },
//     });
//     const clubUsersIds = clubInfo.map((athlete) => {
//       //Map into an array athlete ids.
//       return athlete.userId;
//     });
//     const athleteInfo = await User.findAll({
//       //Use ids to find athletes in the user tables
//       where: { id: clubUsersIds },
//     });
//     res.status(200).json({
//       message: "Success",
//       clubInfo,
//       athleteInfo,
//     });
//   } catch (err) {
//     res.status(500).json({ message: "Server Error" });
//   }
// });
// /**************************
//     GET CHAIRPERSONS
// **************************/
// clubController.get("/getChairpersons/:id", async (req, res) => {
//   const clubId = req.params.id;
//   try {
//     const roles = await ClubRoster.findAll({
//       where: {
//         clubId: clubId,
//         role: { [Op.or]: ["chairperson", "vice chairperson"] },
//       },
//     });
//     const chairpersonsIds = roles.map((athlete) => {
//       return athlete.userId;
//     });
//     const chairpersons = await User.findAll({
//       where: { id: chairpersonsIds },
//     });
//     res.status(200).json({
//       message: "Success",
//       chairpersons,
//       roles,
//     });
//   } catch (err) {
//     res.status(500).json({ message: "Server Error" });
//   }
// });
// /**************************
//     GET CLUBS
// **************************/
// clubController.get("/getClubs", async (req, res) => {
//   const owner = req.user.id;
//   try {
//     const clubRostersInfo = await ClubRoster.findAll({
//       //Find all clubs associated with user in club by id
//       where: { userId: owner },
//     });
//     const clubIds = await clubRostersInfo.map((club) => {
//       //Map into an array athlete ids.
//       return club.clubId;
//     });
//     const clubsInfo = await Club.findAll({
//       //Use ids to find athlete in the user tables
//       where: { id: clubIds },
//     });
//     res.status(200).json({
//       message: "Success",
//       clubsInfo,
//       clubRostersInfo,
//     });
//   } catch (err) {
//     res.status(500).json({ message: "Server Error" });
//   }
// });
// /**************************
//     GET CLUB ACTIVITIES
// **************************/
// clubController.get("/getClubActivities/:id", async (req, res) => {
//   const clubId = req.params.id;
//   const startDate = req.query.startDate;
//   const endDate = req.query.endDate;
//   try {
//     const clubInfo = await ClubRoster.findAll({
//       //Finds all club members activities
//       where: { clubId: clubId },
//     });
//     const athleteIds = clubInfo.map((athlete) => {
//       //Maps athlete id into a new array
//       return athlete.userId;
//     });
//     const clubActivities = await User.findAll({
//       //Finds all athletes' activities using the ids from the map method above.
//       where: { id: athleteIds },
//       include: [
//         {
//           model: Activity,
//           where: { date: { [Op.between]: [startDate, endDate] } },
//         },
//       ],
//     });
//     res.status(200).json({
//       message: "Success",
//       clubInfo,
//       clubActivities,
//     });
//   } catch (err) {
//     res.status(500).json({ message: "Server Error", err });
//   }
// });
// /**************************
//     GET ATHLETE ACTIVITIES
// **************************/
// clubController.get("/getAthleteActivities/:id", async (req, res) => {
//   const athleteId = req.params.id;
//   try {
//     const clubActivities = await User.findOne({
//       where: { id: athleteId },
//       include: "activities",
//     });
//     res.status(200).json({
//       message: "Success",
//       clubActivities,
//     });
//   } catch (err) {
//     res.status(500).json({ message: "Server Error" });
//   }
// });
// /********************************
//     UPDATE CHAIRPERSON ROLE
//  *******************************/
//     clubController.put("/updateChairperson", async (req, res) => {
//       const { userId, clubId, newRole } = req.body;
//       try {
//         const roleCount = await clubRoster.findAll({
//           where: { clubId, role: "chairperson" },
//         });
//         if (roleCount.length === 1 && newRole === "vice chairperson") {
//           //Requires at least one chairperson be on the club
//           res
//             .status(405)
//             .json({ message: "Must have atleast one chairperson on a club" });
//         } else {
//           const clubMember = await clubRoster.findOne({
//             where: { userId: userId, clubId: clubId },
//           });
//           const updatedClubMember = await clubMember.update({ role: newRole });
//           res.status(200).json({
//             message: "Role Updated",
//             updatedClubMember,
//           });
//         }
//       } catch (err) {
//         res.status(500).json({ error: "Server Error" });
//       }
//     });
// /**************************
//     UPDATE CLUB NAME
// **************************/
// clubController.put("/updateClub", async (req, res) => {
//   const { newClubName, clubId } = req.body;
//   try {
//     const club = await Club.findOne({ where: { id: clubId } });
//     const updatedClub = await club.update({ clubName: newClubName });
//     res.status(200).json({
//       message: "Name updated!",
//       updatedClub,
//     });
//   } catch (err) {
//     console.log(err);
//     if (err instanceof UniqueConstraintError) {
//       res.status(409).json({
//         message: `The name '${newClubName}' is already taken.`,
//       });
//     } else {
//       res.status(500).json({ error: "Server Error" });
//     }
//   }
// });
// /**************************
//     REMOVE SELF FROM CLUB
// **************************/
// clubController.delete("/removeSelf", async (req, res) => {
//   const { clubId } = req.body;
//   const athleteId = req.user.id;
//   try {
//     const athlete = await ClubRoster.findOne({
//       //Finds athlete and requires their role to be "athlete".
//       where: { clubId, userId: athleteId },
//     });
//     const roleCount = await ClubRoster.findAll({
//       where: { clubId, role: "chairperson" },
//     });
//     if (roleCount.length === 1 && athlete.role === "chairperson") {
//       //Requires at least one chairperson be on the club
//       res.status(405).json({
//         message:
//           "Removal failed. Must have atleast one chairperson on a club. Go to clubs to delete clubs page.",
//       });
//     } else {
//       const removed = await athlete.destroy(); //Removes that athlete from the clubRoster table.
//       res.status(200).json({
//         message: `Removed from club.`,
//         removed,
//       });
//     }
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({
//       message: "Error. Failed to be removed.",
//       err,
//     });
//   }
// });
// /**************************
//     DELETE ATHLETE
// **************************/
// clubController.delete("/removeAthlete", async (req, res) => {
//   const { athleteId, clubId } = req.body;
//   try {
//     const athlete = await ClubRoster.findOne({
//       //Finds athlete and requires their role to be "athlete".
//       where: { clubId: clubId, userId: athleteId, role: "athlete" },
//     });
//     const removed = await athlete.destroy(); //Removes that athlete from the table.
//     res.status(200).json({
//       message: `Athlete removed from club.`,
//       removed,
//     });
//   } catch (err) {
//     res.status(500).json({
//       message: "Error. Athlete failed to be removed.",
//       err,
//     });
//   }
// });
// /**************************
//     DELETE CLUB MEMBER
// **************************/
// clubController.delete("/removeChairperson", async (req, res) => {
//   const { chairpersonId, clubId } = req.body;
//   try {
//     const member = await clubRoster.findOne({
//       where: { clubId: clubId, userId: chairpersonId },
//     });
//     const removed = await member.destroy();
//     res.status(200).json({
//       message: `Member removed from club.`,
//       removed,
//     });
//   } catch (err) {
//     res.status(500).json({
//       message: "Error. Member failed to be removed.",
//       err,
//     });
//   }
// });
// /**************************
//     DELETE CLUB
// **************************/
// clubController.delete("/removeClub", async (req, res) => {
//   const { clubId } = req.body;
//   try {
//     const club = await Club.findOne({
//       where: { id: clubId },
//     });
//     await club.destroy();
//     res.status(200).json({
//       message: `Club Removed`,
//     });
//   } catch (err) {
//     res.status(500).json({
//       message: "Error. Club failed to delete.",
//       err,
//     });
//   }
// });
exports.default = clubController;
