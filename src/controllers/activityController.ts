import * as dotenv from "dotenv";
dotenv.config();
import { RequestWithUser, CustomError, Activity } from "../models";
import { Response, Router } from "express";
import { userValidation } from "../middleware";
import pool from "../db";
import getQueryArgs from "../utilities/getQueryArgsFn";

const activityController = Router();

/************************
 CREATE ACTIVITIY
************************/
activityController.post("/create", userValidation, async (req: RequestWithUser, res) => {
  try {
    const info = req.body.info;
    const user = req.user!;

    if (info.userId !== user.id) {
      throw new CustomError(401, "Request failed. You can only create your own activities.");
    }

    const [queryString, valArray] = getQueryArgs("insert", "activities", info);

    //Throw custom error if problem with query string.
    if (!queryString) {
      throw new CustomError(400, "Request failed. Activity not created. Query parameters problem.");
    }

    //Send INSERT to DB
    const result = await pool.query(queryString, valArray);
    //Throw error if nothing returnd from DB
    if (result.rowCount === 0) {
      throw new CustomError(400, "Request failed. User not created. DB Insertion problem.");
    }

    const newActivity = result.rows[0];

    res.status(200).json({
      result: newActivity,
      message: "Activity saved.",
    });
  } catch (error) {
    console.log(error);
    if (error.status < 500) {
      res.status(error.status).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error", error });
    }
  }
});

/************************
 GET ACTIVITIES
************************/
activityController.get("/getActivities", userValidation, async (req: RequestWithUser, res: Response) => {
  try {
    const info = req.query;
    const user = req.user!;

    console.log(info);

    //Throw error if user does not own the data.
    if (user.id !== info.userId) {
      throw new CustomError(401, "Request failed. Can only retrieve your activities.");
    }

    //Utility function to get query arguments
    const [queryString, valArray] = getQueryArgs("select", "activities", info);

    const result = await pool.query(queryString, valArray);
    //If blank string, throw error
    if (!queryString) {
      throw new CustomError(400, "Request failed. Lesson assignment not created. Query parameters problem.");
    }

    res.status(200).json({
      message: "Success. Student assigned lesson.",
    });
  } catch (error) {
    console.log(error);
    if (error.status < 500) {
      res.status(error.status).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error", error });
    }
  }
});

/************************
 GET ACTIVITIES BY DATE
************************/
activityController.get("/getActivitiesDate", userValidation, async (req: RequestWithUser, res) => {
  try {
    const user = req.user!;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    //Get data
    const results = await pool.query(
      'SELECT * FROM activities WHERE "userId" = $1 AND date >= "$2"::DATE AND date <= $3::DATE;',
      [user.id, startDate, endDate]
    );

    const athleteActivities = results.rows;

    res.status(200).json({ message: "Activities retrieved", athleteActivities });
  } catch (error) {
    console.log(error);
    if (error.status < 500) {
      res.status(error.status).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error", error });
    }
  }
});

/************************
 UPDATE ACTIVITY
************************/
activityController.put("/update", userValidation, async (req: RequestWithUser, res) => {
  try {
    const info: Activity = req.body.info;
    const user = req.user!;

    //Throw error if data doesn't belong to user
    if (user.id !== info.userId) {
      throw new CustomError(401, "Request failed. Must be your own data.");
    }

    //Utility function to get the query params
    const [queryString, valArray] = getQueryArgs("update", "activities", info, +info.id!);

    //if string is empty, throw error
    if (!queryString) {
      throw new CustomError(400, "Request failed. Data not updated. Query parameters problem.");
    }

    //Send update query to DB
    const result = await pool.query(queryString, valArray);

    //Throw error if nothing is returned
    if (result.rowCount == 0) {
      throw new CustomError(404, "Request failed. Update query problem.");
    }

    //Variable for return data
    const updatedActivity: Activity = result.rows[0];

    res.status(200).json({ message: "Activity updated.", updatedActivity });
  } catch (error) {
    console.log(error);
    if (error.status < 500) {
      res.status(error.status).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error", error });
    }
  }
});

/************************
 DELETE ACTIVITIY
************************/
activityController.delete("/removeActivity/:id", userValidation, async (req: RequestWithUser, res) => {
  try {
    const user = req.user!;
    const activityId = req.params.id;

    //Get data for security check
    const activityResults = await pool.query("SELECT * FROM activities WHERE id = $1", [activityId]);

    const activity = activityResults.rows[0];

    //Throw error if not user's data
    if (activity.userId !== user.id) {
      throw new CustomError(401, "Request failed. Can only delete your personal data.");
    }

    //Send DELETE query to DB
    const results = await pool.query("DELETE FROM activities WHERE id = $1", [activityId]);

    //Throw error if there is no return data
    if (results.rowCount == 0) {
      throw new CustomError(404, "Request failed. Update query problem.");
    }

    res.status(200).json({ message: "Activity Deleted" });
  } catch (error) {
    console.log(error);
    if (error.status < 500) {
      res.status(error.status).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error", error });
    }
  }
});

export default activityController;
