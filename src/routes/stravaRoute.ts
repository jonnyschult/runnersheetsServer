require("dotenv").config();
import axios from "axios";
import { RequestWithUser, User } from "../models";
import { userValidation } from "../middleware";
import getQueryArgs from "../utilities/getQueryArgsFn";
import pool from "../db";
import { Router } from "express";

const stravaRouter = Router();
/***************************
 * GET CLIENT_ID AND CALLBACK URI FOR AUTHFLOW WITH STRAVA
 ***************************/
stravaRouter.get("/getData", userValidation, async (_, res) => {
  try {
    res.status(200).json({
      message: "success",
      stravaID: process.env.STRAVA_ID,
      redirectURI: process.env.STRAVA_CALLBACK,
    });
  } catch (err) {
    res.status(500).json({ err, message: "Server Error" });
  }
});

/***************************
 * GET REFRESH TOKEN FOR USER
 ***************************/

stravaRouter.post("/createRefresh", userValidation, async (req: RequestWithUser, res) => {
  try {
    const info = req.body.info;
    const user = req.user!;
    const results = await axios({
      url: `https://www.strava.com/oauth/token?client_id=${process.env.STRAVA_ID}&client_secret=${process.env.STRAVA_SECRET}&code=${info.authCode}&grant_type=authorization_code`,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: info.authCode,
      },
    });
    user.strava_refresh = results.data.refresh_token;

    //Utility function to get query arguments
    const [queryString, valArray] = getQueryArgs("update", "users", user, +user.id!);

    //Pass UPDATE to users table in DB
    const result = await pool.query(queryString, valArray);

    const updatedUser = result.rows[0];
    res.status(200).json({ message: "Success", updatedUser });
  } catch (error) {
    console.log("Error in strava get confirmation route", error);
    if (error.status < 500) {
      res.status(error.status).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error", error });
    }
  }
});

/***************************
 * GET ACCESS TOKEN FOR USER
 ***************************/
stravaRouter.get("/getAccessToken", userValidation, async (req: RequestWithUser, res) => {
  try {
    const user = req.user!;

    const results = await axios({
      url: `https://www.strava.com/oauth/token`,
      method: "POST",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
      },
      data: {
        client_id: process.env.STRAVA_ID,
        client_secret: process.env.STRAVA_SECRET,
        refresh_token: user.strava_refresh,
        grant_type: "refresh_token",
      },
    });
    user.strava_refresh = results.data.refresh_token;

    //Utility function to get query arguments
    const [queryString, valArray] = getQueryArgs("update", "users", user, +user.id!);

    //Pass UPDATE to users table in DB
    await pool.query(queryString, valArray);
    const accessToken = results.data.access_token;
    res.status(200).json({ message: "Success", accessToken });
  } catch (error) {
    console.log("Error in fitbit get access token route", error);
    if (error.status < 500) {
      res.status(error.status).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error", error });
    }
  }
});

export default stravaRouter;
