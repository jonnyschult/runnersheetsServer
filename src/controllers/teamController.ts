import { RequestWithUser, Team, TeamRoster, User, CustomError } from "../models";
import { Router } from "express";
import { userValidation } from "../middleware";
import pool from "../db";
import getQueryArgs from "../utilities/getQueryArgsFn";

const teamController = Router();

/****************************
    CREATE TEAM
****************************/
teamController.post("/create", userValidation, async (req: RequestWithUser, res, next) => {
  const info: Team = req.body.info;
  const user = req.user!;
  try {
    let [queryString, valArray] = getQueryArgs("insert", "teams", info);

    //Throw custom error if problem with query string.
    if (!queryString) {
      throw new CustomError(400, "Request failed. Data not created. Query parameters problem.");
    }

    //Send INSERT to DB
    const teamResults = await pool.query(queryString, valArray);
    //Throw error if nothing returnd from DB
    if (teamResults.rowCount === 0) {
      throw new CustomError(400, "Request failed. User not created. DB Insertion problem.");
    }
    const newTeam: Team = teamResults.rows[0];

    const rosterInfo: TeamRoster = { role: "manager", teamId: newTeam.id!, userId: user.id! };
    const [rosterQueryString, rosterValArray] = getQueryArgs("insert", "teamRosters", rosterInfo);
    if (!rosterQueryString) {
      throw new CustomError(400, "Request failed. Data not created. Query parameters problem.");
    }
    const rosterResults = await pool.query(rosterQueryString, rosterValArray);
    if (rosterResults.rowCount === 0) {
      throw new CustomError(400, "Request failed. User not created. DB Insertion problem.");
    }
    const newTeamRoster = rosterResults.rows[0];

    let updatedUser = user;
    if (!user.isCoach) {
      const userResults = await pool.query("UPDATE users SET isCoach=true WEHRE id = $1", [user.id]);
      updatedUser = userResults.rows[0];
    }

    res.status(200).json({ message: "Team Created", newTeam, newTeamRoster, updatedUser });
  } catch (error) {
    console.log(error);
    if (error.status < 500) {
      res.status(error.status).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error", error });
    }
  }
});

export default teamController;
