import { Club, ClubRoster, User, Activity } from "../models"
import jwt from "jsonwebtoken"
import { Router } from "express"

const clubController = Router();

/****************************
    CREATE CLUB
****************************/
clubController.post("/create", async (req, res) => {
  const clubName = req.body.clubName;
  const owner = req.user.id;
  try {
    const newClub = await Club.create({
      //Creates club in clubs table
      clubName,
    });

    const newClubRoster = await ClubRoster.create({
      //Create association and role in ClubRosters table
      role: "chairperson", //Creator of club is a default chairperson.
      clubId: newClub.id,
      userId: owner,
    });

    res.status(200).json({
      result: { newClub, newClubRoster },
      message: "Club Founded",
    });
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      res.status(409).json({
        message: `The name '${clubName}' is already taken.`,
      });
    } else {
      res.status(500).json({
        result: err,
        message: "Server Error",
      });
    }
  }
});

/**************************
    GET ATHLETES
**************************/
clubController.get("/getAthletes/:id", async (req, res) => {
  const clubId = req.params.id;
  try {
    const clubInfo = await ClubRoster.findAll({
      //Find all athlete in club by id
      where: { clubId: clubId, role: "athlete" },
    });
    const clubUsersIds = clubInfo.map((athlete) => {
      //Map into an array athlete ids.
      return athlete.userId;
    });
    const athleteInfo = await User.findAll({
      //Use ids to find athletes in the user tables
      where: { id: clubUsersIds },
    });
    res.status(200).json({
      message: "Success",
      clubInfo,
      athleteInfo,
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

/**************************
    GET CHAIRPERSONS
**************************/
clubController.get("/getChairpersons/:id", async (req, res) => {
  const clubId = req.params.id;
  try {
    const roles = await ClubRoster.findAll({
      where: {
        clubId: clubId,
        role: { [Op.or]: ["chairperson", "vice chairperson"] },
      },
    });
    const chairpersonsIds = roles.map((athlete) => {
      return athlete.userId;
    });
    const chairpersons = await User.findAll({
      where: { id: chairpersonsIds },
    });
    res.status(200).json({
      message: "Success",
      chairpersons,
      roles,
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

/**************************
    GET CLUBS
**************************/
clubController.get("/getClubs", async (req, res) => {
  const owner = req.user.id;
  try {
    const clubRostersInfo = await ClubRoster.findAll({
      //Find all clubs associated with user in club by id
      where: { userId: owner },
    });
    const clubIds = await clubRostersInfo.map((club) => {
      //Map into an array athlete ids.
      return club.clubId;
    });
    const clubsInfo = await Club.findAll({
      //Use ids to find athlete in the user tables
      where: { id: clubIds },
    });
    res.status(200).json({
      message: "Success",
      clubsInfo,
      clubRostersInfo,
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

/**************************
    GET CLUB ACTIVITIES
**************************/
clubController.get("/getClubActivities/:id", async (req, res) => {
  const clubId = req.params.id;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  try {
    const clubInfo = await ClubRoster.findAll({
      //Finds all club members activities
      where: { clubId: clubId },
    });
    const athleteIds = clubInfo.map((athlete) => {
      //Maps athlete id into a new array
      return athlete.userId;
    });
    const clubActivities = await User.findAll({
      //Finds all athletes' activities using the ids from the map method above.
      where: { id: athleteIds },
      include: [
        {
          model: Activity,
          where: { date: { [Op.between]: [startDate, endDate] } },
        },
      ],
    });
    res.status(200).json({
      message: "Success",
      clubInfo,
      clubActivities,
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", err });
  }
});

/**************************
    GET ATHLETE ACTIVITIES
**************************/
clubController.get("/getAthleteActivities/:id", async (req, res) => {
  const athleteId = req.params.id;
  try {
    const clubActivities = await User.findOne({
      where: { id: athleteId },
      include: "activities",
    });
    res.status(200).json({
      message: "Success",
      clubActivities,
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

/**************************
    REMOVE SELF FROM CLUB
**************************/
clubController.delete("/removeSelf", async (req, res) => {
  const { clubId } = req.body;
  const athleteId = req.user.id;
  try {
    const athlete = await ClubRoster.findOne({
      //Finds athlete and requires their role to be "athlete".
      where: { clubId, userId: athleteId },
    });
    const roleCount = await ClubRoster.findAll({
      where: { clubId, role: "chairperson" },
    });
    if (roleCount.length === 1 && athlete.role === "chairperson") {
      //Requires at least one chairperson be on the club
      res.status(405).json({
        message:
          "Removal failed. Must have atleast one chairperson on a club. Go to clubs to delete clubs page.",
      });
    } else {
      const removed = await athlete.destroy(); //Removes that athlete from the clubRoster table.
      res.status(200).json({
        message: `Removed from club.`,
        removed,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Error. Failed to be removed.",
      err,
    });
  }
});

export default clubController;
