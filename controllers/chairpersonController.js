const { Activity, Club, ClubRoster, User } = require("../models");
const { Router } = require("express");
const sequelize = require("../db");
const chairpersonController = Router();
const { UniqueConstraintError, Op } = require("sequelize");

/********************************
    ADD Chairperson
 *******************************/
chairpersonController.post("/addChairperson", async (req, res) => {
  const { memberEmail, clubId, role } = req.body;
  try {
    const clubMember = await User.findOne({ where: { email: memberEmail } }); //Find userId for new clubMember by email address.
    const clubRole = await ClubRoster.findOne({where: {id: clubMember.id, role}})
    if(clubRole){throw {Num: 403} }
    if (clubMember) {
      await clubRoster.create({
        role,
        clubId,
        userId: clubMember.id,
      });
      res.status(200).json({
        message: `${clubMember.firstName} was added to the club as a ${role}.`,
      });
    } else {
      res.status(404).json({ error: "Can't find that account." });
    }
  } catch (err) {
    if (err.num === 403) {
      res.status(403).json({
        message: `${memberEmail} is already on the club as a ${role}`,
      });
    } else {
      res.status(500).json({
        message: "server error",
        error: err,
      });
    }
  }
});

/**************************
    UPDATE CLUB NAME
**************************/
chairpersonController.put("/updateClub", async (req, res) => {
  const { newClubName, clubId } = req.body;
  try {
    const club = await Club.findOne({ where: { id: clubId } });
    const updatedClub = await club.update({ clubName: newClubName });
    res.status(200).json({
      message: "Name updated!",
      updatedClub,
    });
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      res.status(409).json({
        message: `The name '${newClubName}' is already taken.`,
      });
    } else {
      res.status(500).json({ error: "Server Error" });
    }
  }
});

/********************************
    UPDATE CHAIRPERSON ROLE
 *******************************/
chairpersonController.put("/updateChairperson", async (req, res) => {
  const { userId, clubId, newRole } = req.body;
  try {
    const roleCount = await clubRoster.findAll({
      where: { clubId, role: "chairperson" },
    });
    if (roleCount.length === 1 && newRole === "vice chairperson") {
      //Requires at least one chairperson be on the club
      res
        .status(405)
        .json({ message: "Must have atleast one chairperson on a club" });
    } else {
      const clubMember = await clubRoster.findOne({
        where: { userId: userId, clubId: clubId },
      });
      const updatedClubMember = await clubMember.update({ role: newRole });
      res.status(200).json({
        message: "Role Updated",
        updatedClubMember,
      });
    }
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
});

/**************************
    DELETE CLUB MEMBER
**************************/
chairpersonController.delete("/removeChairperson", async (req, res) => {
  const { chairpersonId, clubId } = req.body;
  try {
    const member = await clubRoster.findOne({
      where: { clubId: clubId, userId: chairpersonId },
    });
    const removed = await member.destroy();
    res.status(200).json({
      message: `Member removed from club.`,
      removed,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error. Member failed to be removed.",
      err,
    });
  }
});

/**************************
    DELETE CLUB 
**************************/
chairpersonController.delete("/removeClub", async (req, res) => {
  const { clubId } = req.body;
  try {
    const club = await Club.findOne({
      where: { id: clubId },
    });
    await club.destroy();
    res.status(200).json({
      message: `Club Removed`,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error. Club failed to delete.",
      err,
    });
  }
});

module.exports = chairpersonController;
