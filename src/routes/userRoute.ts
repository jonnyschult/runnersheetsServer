import * as dotenv from "dotenv";
dotenv.config();
import { User, RequestWithUser, CustomError, ClubsUsers, TeamsUsers, Club, Team } from "../models";
import { Response, Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { userValidation } from "../middleware";
import pool from "../db";
import getQueryArgs from "../utilities/getQueryArgsFn";

const userController = Router();
/***************************
 * USER REGISTER
 ***************************/
userController.post("/register", async (req, res) => {
  const info: User = req.body.info;

  try {
    if (info.password!.length < 8) {
      throw new CustomError(406, "Password less than 8 characters long");
    }
    const passwordhash: string = bcrypt.hashSync(info.password, 10);
    delete info.password;
    info.passwordhash = passwordhash;

    // utility function to generate query parameters
    const [queryString, valArray] = getQueryArgs("insert", "users", info);
    //Send INSERT to users table in DB
    const result = await pool.query(queryString, valArray);

    //assign varraible for return data
    const newUser = result.rows[0];

    //jwt sign id to create token
    const token: string = await jwt.sign({ id: newUser.id }, process.env.JWT_SECRET!, {
      expiresIn: "1d",
    });

    //Deletes passwordhash to prevent sending back sensitive info
    delete newUser.passwordhash;
    res.status(200).json({ message: "User Created", token, user: newUser });
  } catch (error) {
    console.log("in Register Route", error);
    if (error.status < 500) {
      res.status(error.status).json({ message: error.message });
    } else if (error.constraint === "users_email_key") {
      //bit hacky, but sends unique error back which is easier to catch on the front end.
      res.status(409).json({ message: "User already exists", error });
    } else {
      res.status(500).json({ message: "Internal server error", error });
    }
  }
});

/***************************
 * USER LOGIN
 ***************************/
userController.post("/login", async (req, res) => {
  try {
    //user is of type User defined in the models
    const info: User = req.body.info;

    //Send email to get user info from users table in DB
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [info.email]); //Get query results

    //Throw error if the result didn't yield anything
    if (result.rowCount === 0) {
      throw new CustomError(404, "Request failed. Couldn't find user");
    }

    //Set variable for return info
    const queryUser: User = result.rows[0]; //Set queryUser as the result of the query to the users table.

    //Returns a boolean predicated on the matching of the passwords
    const validPass = await bcrypt.compare(info.password, queryUser.passwordhash!);

    //Throw error if the passwords don't match.
    if (!validPass) {
      throw new CustomError(400, "Request failed. Wrong password.");
    }

    //Create token for user id
    const token: string = await jwt.sign({ id: queryUser.id }, process.env.JWT_SECRET!, {
      expiresIn: "1d",
    });

    //Delete sensitive information so as to not send it back.
    delete queryUser.passwordhash;

    res.status(200).json({
      message: "Successfully Logged in!",
      user: queryUser,
      token,
    });
  } catch (error) {
    console.log("in Login Route", error);
    if (error.status < 500) {
      res.status(error.status).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error", error });
    }
  }
});

/**************************
    GET USER
**************************/
userController.get("/getUser", userValidation, async (req: RequestWithUser, res: Response) => {
  try {
    //get user from validation session
    const user = req.user!;

    //Delete all password hashes for return data
    delete user.passwordhash;

    const startDate = new Date().getTime() - 604800000;
    const endDate = new Date().getTime();

    const teamsResults = await pool.query(
      "SELECT DISTINCT team_name, id FROM teams INNER JOIN teams_users ON teams.id = teams_users.team_id WHERE teams_users.user_id = $1;",
      [user.id]
    );
    const clubsResults = await pool.query(
      "SELECT * FROM clubs INNER JOIN clubs_users ON clubs.id = clubs_users.club_id WHERE clubs_users.user_id = $1;",
      [user.id]
    );
    const activitiesResults = await pool.query(
      "SELECT * FROM activities WHERE user_id = $1 AND (date >= $2 AND date <= $3);",
      [user.id, startDate, endDate]
    );
    const teamsUsersResults = await pool.query("SELECT * FROM teams_users WHERE user_id = $1;", [user.id]);
    const clubsUsersResults = await pool.query("SELECT * FROM clubs_users WHERE user_id = $1;", [user.id]);

    const clubsUsers: ClubsUsers[] = clubsUsersResults.rows;
    const teamsUsers: TeamsUsers[] = teamsUsersResults.rows;
    const teamsNoRoles: Team[] = teamsResults.rows;
    const clubsNoRoles: Club[] = clubsResults.rows;

    const teams = teamsNoRoles.map((team) => {
      teamsUsers.forEach((teamUser) => {
        if (teamUser.team_id === team.id) {
          team.role = teamUser.role;
          return team;
        }
      });
      return team;
    });
    console.log(teamsResults.rows);
    const clubs = clubsNoRoles.map((club) => {
      clubsUsers.forEach((clubUser) => {
        if (clubUser.club_id === club.id) {
          club.role = clubUser.role;
          return club;
        }
      });
      return club;
    });
    const activities = activitiesResults.rows;

    //Responds with success message and the array of users
    res.status(200).json({ message: "Success", user, clubs, teams, activities });
  } catch (error) {
    console.log("In the get user route", error);
    res.status(500).json({ message: "Internal server error", error });
  }
});

/**************************
    UPDATE USER INFO
**************************/
userController.put("/updateUser", userValidation, async (req: RequestWithUser, res) => {
  try {
    const info = req.body.info;
    const user = req.user!;

    //Utility function to get query arguments
    const [queryString, valArray] = getQueryArgs("update", "users", info, +user.id!);

    //Pass UPDATE to users table in DB
    const result = await pool.query(queryString, valArray);

    const updatedUser = result.rows[0];

    res.status(200).json({ message: "Account Updated!", updatedUser });
  } catch (error) {
    console.log("in Update User Info Route", error);
    res.status(500).json({ message: "Internal server error", error });
  }
});

/**************************
    UPDATE USER PASSWORD
**************************/
userController.put(
  "/updatePassword",
  userValidation, // Validates user and gives us req.user property
  async (req: RequestWithUser, res: Response) => {
    try {
      //Get info to update from req.body
      const updateInfo: { oldPassword: string; newPassword: string } = req.body.info;
      //Get user from validation session
      const user = req.user!;

      //Pass UPDATE query to users table in DB
      const result = await pool.query("SELECT * FROM users WHERE id = $1", [user.id]);

      //Throw error if nothing is returned
      if (result.rowCount === 0) {
        throw new CustomError(404, "Request failed. No such user found.");
      }

      //Set variable for return data
      const queryUser: User = result.rows[0];

      //bcrypt.compare returns a boolean. False if the passwords don't match
      const validPass = await bcrypt.compare(updateInfo.oldPassword, queryUser.passwordhash!);

      //Throw error if the password is invalid.
      if (!validPass) {
        throw new CustomError(400, "Request failed. Wrong password.");
      }

      //Hash password before saving to db
      const passwordhash: string = bcrypt.hashSync(updateInfo.newPassword, 10);

      //save hashed password
      await pool.query("UPDATE users SET passwordhash = $1", [passwordhash]);

      res.status(200).json({ message: "Password Updated" });
    } catch (error) {
      console.log("in Update User Info Route", error);
      if (error.status < 500) {
        res.status(error.status).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error", error });
      }
    }
  }
);

/**************************
    DELETE USER
**************************/
userController.delete(
  "/deleteUser/:id",
  userValidation, // Validates user and gives us req.user property
  async (req: RequestWithUser, res: Response) => {
    try {
      //Id of user to delete
      const idToRemove = +req.params.id;
      //Get user set in validation session
      const user = req.user!;

      //Throw an error if user is not deleting themselves
      if (idToRemove !== user.id) {
        throw new CustomError(401, "User not deleted. Need to be logged in as user or admin");
      }

      //Send DELETE query to users table in DB
      await pool.query("DELETE FROM users WHERE id = $1", [idToRemove]);

      res.status(200).json({ message: "User Deleted" });
    } catch (error) {
      console.log("in Delete User Route", error);
      if (error.status < 500) {
        res.status(error.status).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error", error });
      }
    }
  }
);

export default userController;
