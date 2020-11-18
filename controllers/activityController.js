const { Activity } = require("../models");
const { Router } = require("express");
const sequelize = require("../db");

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
    strava_id,
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
      strava_id,
      userId: owner,
    });
    res.status(200).json({
      result: newActivity,
      message: "Activity saved.",
    });
  } catch (err) {
    res.status(500).json({
      result: err,
      message: "Server error. Activity not saved.",
    });
  }
});

/************************
 GET ACTIVITIES
************************/
activityController.get("/getActivities/:id", async (req, res) => {
  const owner = req.params.id;
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
  const { activityId } = req.body;
  const owner = req.user.id;
  try {
    await Activity.destroy({ where: { id: activityId, userId: owner } });
    res.status(200).json({ message: "Activity Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = activityController;
