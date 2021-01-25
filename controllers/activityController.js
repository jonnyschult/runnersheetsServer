const { Activity } = require("../models");
const { Router } = require("express");
const sequelize = require("../db");
const { Op } = require("sequelize");

const activityController = Router();

/************************
 CREATE ACTIVITIY
************************/
activityController.post("/create", async (req, res) => {
  const {
    date,
    meters,
    durationSecs,
    elevationMeters,
    avgHR,
    maxHR,
    description,
    stravaId,
    garminId,
    fitbitId,
  } = req.body;
  const owner = req.user.id;

  try {
    const newActivity = await Activity.create({
      date,
      meters,
      durationSecs,
      elevationMeters,
      avgHR,
      maxHR,
      description,
      stravaId,
      garminId,
      fitbitId,
      userId: owner,
    });
    res.status(200).json({
      result: newActivity,
      message: "Activity saved.",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ err });
  }
});

/************************
 GET ALL ACTIVITIES
************************/
activityController.get("/getActivities", async (req, res) => {
  const owner = req.user.id;
  try {
    const atheleteActivities = await Activity.findAll({
      where: { userId: owner },
    });
    if (atheleteActivities) {
      res
        .status(200)
        .json({ message: "Activities retrieved", result: atheleteActivities });
    } else {
      res.status(404).json({ message: "Activities not found." });
    }
  } catch (err) {
    res.status(500).json({ message: "Server Error." });
  }
});

/************************
 GET ACTIVITIES BY DATE
************************/
activityController.get("/getActivitiesDate", async (req, res) => {
  const owner = req.user.id;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  try {
    const atheleteActivities = await Activity.findAll({
      where: { userId: owner, date: { [Op.between]: [startDate, endDate] } },
    });
    if (atheleteActivities) {
      res
        .status(200)
        .json({ message: "Activities retrieved", result: atheleteActivities });
    } else {
      res.status(404).json({ message: "Activities not found." });
    }
  } catch (err) {
    res.status(500).json({ message: "Server Error." });
  }
});

/************************
 UPDATE ACTIVITIES
************************/
activityController.put("/update", async (req, res) => {
  const {
    activityId,
    date,
    meters,
    durationSecs,
    elevationMeters,
    avgHR,
    maxHR,
    description,
  } = req.body;
  const owner = req.user.id;

  try {
    const targetActivity = await Activity.findOne({
      where: { id: activityId, userId: owner },
    });
    if (targetActivity) {
      const updatedActivity = await targetActivity.update({
        date,
        meters,
        durationSecs,
        elevationMeters,
        avgHR,
        maxHR,
        description,
      });
      res.status(200).json({
        result: updatedActivity,
        message: "Activity updated.",
      });
    } else {
      res.status(404).json({
        message: "Activity not found",
      });
    }
  } catch (err) {
    console.log(err)
    res.status(500).json({
      result: err,
      message: "Server error. Activity not updated.",
    });
  }
});

/************************
 DELETE ACTIVITIY
************************/
activityController.delete("/removeActivity", async (req, res) => {
  const { activityId, fitbitId } = req.body;
  const owner = req.user.id;
  try {
    if (activityId) {
      await Activity.destroy({
        where: { id: activityId, userId: owner },
      });
    } else if (fitbitId) {
      await Activity.destroy({
        where: { fitbitId: fitbitId, userId: owner },
      });
    } else {
      throw new Error();
    }
    res.status(200).json({ message: "Activity Deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = activityController;
