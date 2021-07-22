require("dotenv").config();
import axios from "axios";
import { RequestWithUser, User } from "../models";
import { userValidation } from "../middleware";
import getQueryArgs from "../utilities/getQueryArgsFn";
import pool from "../db";
import { Router } from "express";

const fitbitRouter = Router();
//TODO Redundant: Move to one route and return all info.
/***************************
 * GET CLIENT_ID AND CALLBACK URI FOR AUTHFLOW WITH FITBIT
 ***************************/
fitbitRouter.get("/getAuth", async (req, res) => {
  try {
    res.status(200).json({
      message: "success",
      clientId: process.env.FITBIT_ID,
      redirectURI: process.env.FITBIT_CALLBACK,
    });
  } catch (err) {
    res.status(500).json({ err, message: "Server Error" });
  }
});

/***************************
 * GET REFRESH TOKEN FOR USER
 ***************************/
fitbitRouter.post("/createRefresh", userValidation, async (req: RequestWithUser, res) => {
  try {
    const info = req.body.info;
    const user = req.user!;
    const results = await axios({
      url: `https://api.fitbit.com/oauth2/token?code=${info.authCode}&grant_type=authorization_code&redirect_uri=${process.env.FITBIT_CALLBACK}`,
      method: "POST",
      headers: {
        Authorization: `Basic ${process.env.FITBIT_BASE64}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    console.log(results.data);
    user.fitbit_refresh = results.data.refresh_token;

    //Utility function to get query arguments
    const [queryString, valArray] = getQueryArgs("update", "users", user, +user.id!);

    //Pass UPDATE to users table in DB
    const result = await pool.query(queryString, valArray);

    const updatedUser = result.rows[0];
    res.status(200).json({ message: "Success", updatedUser });
  } catch (error) {
    console.log("Error in fitbit create refresh token route", error);
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
fitbitRouter.get("/getAccessToken", userValidation, async (req: RequestWithUser, res) => {
  try {
    const user = req.user!;
    const results = await axios({
      url: `https://api.fitbit.com/oauth2/token?&grant_type=refresh_token&refresh_token=${user.fitbit_refresh}`,

      method: "POST",
      headers: {
        Authorization: `Basic ${process.env.FITBIT_BASE64}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    console.log(results.data);
    user.fitbit_refresh = results.data.refresh_token;

    //Utility function to get query arguments
    const [queryString, valArray] = getQueryArgs("update", "users", user, +user.id!);

    //Pass UPDATE to users table in DB
    const result = await pool.query(queryString, valArray);
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

export default fitbitRouter;
