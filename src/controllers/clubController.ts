import { RequestWithUser, Club, ClubsUsers, User, CustomError } from "../models";
import { Router } from "express";
import { userValidation } from "../middleware";
import pool from "../db";
import getQueryArgs from "../utilities/getQueryArgsFn";
import roleValidator from "../utilities/roleValidator";
const clubController = Router();

/****************************
    CREATE CLUB
****************************/
clubController.post("/createClub", userValidation, async (req: RequestWithUser, res) => {
  try {
    const info = req.body.info;
    const user = req.user!;

    console.log(info);
    let [queryString, valArray] = getQueryArgs("insert", "clubs", info);
    //Send INSERT to DB
    const clubResults = await pool.query(queryString, valArray);
    //Throw error if nothing returnd from DB
    const newClub: Club = clubResults.rows[0];

    //add chair who created club.
    const clubsUsersInfo: ClubsUsers = { role: "chair", club_id: newClub.id!, user_id: user.id! };
    const [clubsUsersQuery, clubsUsersArray] = getQueryArgs("insert", "clubs_users", clubsUsersInfo);
    if (!clubsUsersQuery) {
      throw new CustomError(400, "Request failed. Data not created. Query parameters problem.");
    }
    const clubsUsersResults = await pool.query(clubsUsersQuery, clubsUsersArray);
    const newClubRoster = clubsUsersResults.rows[0];

    res.status(200).json({ newClub, newClubRoster, message: "Club Founded" });
  } catch (error) {
    console.log(error);
    if (error.status < 500) {
      res.status(error.status).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error", error });
    }
  }
});

/***********************
    ADD CLUB ATHLETE
***********************/
clubController.post("/addAthlete", userValidation, async (req: RequestWithUser, res) => {
  try {
    const info = req.body.info;
    const user = req.user!;

    //checks that updater is chair or vice_chair for club, if not, throws error.
    await roleValidator(user.id!, info.club_id, ["chair", "vice_chair"], "clubs_users");

    //finds user by email.
    const clubMemberResults = await pool.query("SELECT * FROM users WHERE email = $1", [info.email]);
    if (clubMemberResults.rowCount === 0) {
      throw new CustomError(404, "Request failed. Athlete not found.");
    }
    const clubMember: User = clubMemberResults.rows[0];

    //adds found user to club.
    const queryInfo: ClubsUsers = { role: "athlete", club_id: info.club_id, user_id: clubMember.id! };
    const [queryString, valArray] = getQueryArgs("insert", "clubs_users", queryInfo);
    const clubRosterResults = await pool.query(queryString, valArray);
    const newRosterEntry = clubRosterResults.rows[0];

    res.status(200).json({
      message: `${clubMember.first_name} was added to the club as a member.`,
      newRosterEntry,
      clubMember,
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

/********************************
    ADD Chairperson 
 *******************************/
clubController.post("/addChair", userValidation, async (req: RequestWithUser, res) => {
  try {
    const info = req.body.info;
    const user = req.user!;

    //checks role permissions. if not the proper role, throws error.
    if (info.role === "chair") {
      await roleValidator(user.id!, info.club_id, ["chair"], "clubs_users");
    } else if (info.role === "vice_chair") {
      await roleValidator(user.id!, info.club_id, ["chair", "vice_chair"], "clubs_users");
    } else {
      throw new CustomError(401, "That role cannot be added through this route.");
    }

    //finds user by email.
    const clubMemberResults = await pool.query("SELECT * FROM users WHERE email = $1", [info.email]);
    if (clubMemberResults.rowCount === 0) {
      throw new CustomError(404, "Request failed. User not found.");
    }
    const clubMember: User = clubMemberResults.rows[0];

    //adds found user to club.
    const queryInfo: ClubsUsers = { role: info.role, club_id: info.club_id, user_id: clubMember.id! };
    const [queryString, valArray] = getQueryArgs("insert", "clubs_users", queryInfo);
    const clubRosterResults = await pool.query(queryString, valArray);
    const newRosterEntry: ClubsUsers = clubRosterResults.rows[0];

    res.status(200).json({
      message: `${clubMember.first_name} was added to the club as a ${newRosterEntry.role}.`,
      clubMember,
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

/**************************
    GET CLUB MEMBERS 
**************************/
clubController.get("/getClubMembers/:id", userValidation, async (req: RequestWithUser, res) => {
  try {
    const club_id = +req.params.id;
    const user = req.user!;
    //checks that updater is chair, vice_chair, or athlete for club, if not, throws error.
    await roleValidator(user.id!, club_id, ["chair", "vice_chair", "athlete"], "clubs_users");

    const athletesResults = await pool.query(
      "SELECT * FROM users INNER JOIN clubs_users ON users.id = clubs_users.user_id WHERE clubs_users.club_id = $1 AND clubs_users.role = $2;",
      [club_id, "athlete"]
    );
    const viceChairResults = await pool.query(
      "SELECT * FROM users INNER JOIN clubs_users ON users.id = clubs_users.user_id WHERE clubs_users.club_id = $1 AND clubs_users.role = $2;",
      [club_id, "vice_chair"]
    );
    const chairResults = await pool.query(
      "SELECT * FROM users INNER JOIN clubs_users ON users.id = clubs_users.user_id WHERE clubs_users.club_id = $1 AND clubs_users.role = $2;",
      [club_id, "chair"]
    );

    const athletes: User[] = athletesResults.rows;
    const viceChairs: User[] = viceChairResults.rows;
    const chairs: User[] = chairResults.rows;

    res.status(200).json({
      message: "Success",
      athletes,
      viceChairs,
      chairs,
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

/**************************
    GET CLUBS
**************************/
clubController.get("/getClubs", userValidation, async (req: RequestWithUser, res) => {
  try {
    const user = req.user!;

    const clubsResults = await pool.query(
      "SELECT * FROM clubs INNER JOIN clubs_users ON clubs.id = clubs_users.club_id WHERE clubs_users.user_id = $1;",
      [user.id]
    );
    const clubs = clubsResults.rows;
    res.status(200).json({ message: "Success", clubs });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

/**************************
    GET CLUB ACTIVITIES
**************************/
clubController.get("/getClubActivities/:id", userValidation, async (req: RequestWithUser, res) => {
  try {
    const club_id = +req.params.id;
    const info = req.query;
    const user = req.user!;
    //checks that updater is chair, vice_chair, or athlete for club, if not, throws error.
    await roleValidator(user.id!, club_id, ["chair", "vice_chair", "athlete"], "clubs_users");

    //gets all athletes activities
    const results = await pool.query(
      "SELECT * FROM activities INNER JOIN clubs_users ON activities.user_id = clubs_users.user_id WHERE clubs_users.club_id = $1 AND (date >= $2 AND date <= $3);",
      [club_id, info.start_date, info.end_date]
    );

    const activities = results.rows;

    res.status(200).json({ message: "Success", activities });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

/********************************
    UPDATE CHAIRPERSON ROLE
 *******************************/
clubController.put("/updateChairperson", userValidation, async (req: RequestWithUser, res) => {
  try {
    const info: ClubsUsers = req.body.info;
    const user = req.user!;
    //checks that updater is chair for club, if not, throws error.
    await roleValidator(user.id!, info.club_id, ["chair"], "clubs_users");

    //Pass UPDATE to DB
    const result = await pool.query(
      `UPDATE clubs_users SET role = $1 WHERE club_id = $2 AND user_id = $3 RETURNING *`,
      [info.role, info.club_id, info.user_id]
    );
    const updatedClubsUsersItem = result.rows[0];

    res.status(200).json({ message: "Role Updated", updatedClubsUsersItem });
  } catch (error) {
    console.log(error);
    if (error.status < 500) {
      res.status(error.status).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error", error });
    }
  }
});

/**************************
    UPDATE CLUB NAME
**************************/
clubController.put("/updateClub", userValidation, async (req: RequestWithUser, res) => {
  try {
    const info: Club = req.body.info;
    const user = req.user!;

    await roleValidator(user.id!, info.id!, ["chair"], "clubs_users");

    //Utility function to get query arguments
    const [queryString, valArray] = getQueryArgs("update", "clubs", info, info.id);

    //Pass UPDATE to DB
    const result = await pool.query(queryString, valArray);

    const updatedClub = result.rows[0];

    res.status(200).json({ message: "Name updated!", updatedClub });
  } catch (error) {
    console.log(error);
    if (error.status < 500) {
      res.status(error.status).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error", error });
    }
  }
});

/**************************
    REMOVE SELF FROM CLUB
**************************/
clubController.delete("/removeSelf/:id", userValidation, async (req: RequestWithUser, res) => {
  try {
    const club_id = req.params.id;
    const user = req.user!;

    //checks that user is on team/club, if not, throws error.
    await roleValidator(user.id!, +club_id!, ["chair", "vice_chair", "athlete"], "clubs_users");

    //Ensures that at least one chair remains on the club.
    const chairResults = await pool.query("SELECT * FROM clubs_users WHERE club_id = $1 AND role = $2;", [
      club_id,
      "chair",
    ]);
    if (chairResults.rowCount === 1 && chairResults.rows[0].user_id === user.id) {
      throw new CustomError(403, "Must be atleast one chair on club.");
    }

    //Send DELETE query to DB
    const results = await pool.query("DELETE FROM clubs_users WHERE club_id = $1 AND user_id = $2", [
      club_id,
      user.id,
    ]);

    const removed = results.rows[0];

    res.status(200).json({ message: "Removed from club.", removed });
  } catch (error) {
    console.log(error);
    if (error.status < 500) {
      res.status(error.status).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error", error });
    }
  }
});

/**************************
    DELETE ATHLETE
**************************/
clubController.delete("/removeAthlete", userValidation, async (req: RequestWithUser, res) => {
  try {
    const info = req.query;
    const user = req.user!;
    //checks that updater is chair or manager on team, if not, throws error.
    await roleValidator(+user.id!, +info.club_id!, ["chair", "vice_chair"], "clubs_users");

    //Send DELETE query to DB
    const [queryString, valArray] = getQueryArgs("delete", "clubs_users", info);

    const results = await pool.query(queryString, valArray);

    if (results.rowCount === 0) {
      throw new CustomError(404, "Clubmember not deleted. Could not find clubmember.");
    }

    res.status(200).json({ message: "Removed from club." });
  } catch (error) {
    console.log(error);
    if (error.status < 500) {
      res.status(error.status).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error", error });
    }
  }
});

/**************************
    DELETE CHAIRPERSON
**************************/
clubController.delete("/removeChairperson", userValidation, async (req: RequestWithUser, res) => {
  try {
    const info = req.query;
    const user = req.user!;
    //checks that deleter is chair, if not, throws error.
    await roleValidator(user.id!, +info.club_id!, ["chair"], "clubs_users");

    //Ensures that at least one chair remains on the club.
    const chairResults = await pool.query("SELECT * FROM clubs_users WHERE club_id = $1 AND role = $2;", [
      +info.club_id!,
      "chair",
    ]);
    if (chairResults.rowCount === 1 && chairResults.rows[0].user_id === user.id) {
      throw new CustomError(403, "Must be atleast one chair on club.");
    }

    //Send DELETE query to DB
    const results = await pool.query("DELETE FROM clubs_users WHERE club_id = $1 AND user_id = $2;", [
      info.club_id,
      user.id,
    ]);

    const removed = results.rows[0];

    res.status(200).json({ message: "Removed from club.", removed });
  } catch (error) {
    console.log(error);
    if (error.status < 500) {
      res.status(error.status).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error", error });
    }
  }
});

/**************************
    DELETE CLUB
**************************/
clubController.delete("/removeClub", userValidation, async (req: RequestWithUser, res) => {
  try {
    const info = req.query;
    const user = req.user!;

    await roleValidator(+user.id!, +info.id!, ["chair"], "clubs_users");

    //Send DELETE query to users table in DB
    const results = await pool.query("DELETE FROM clubs WHERE id = $1", [info.id]);

    const removed = results.rows[0];

    res.status(200).json({ message: "Club Removed", removed });
  } catch (error) {
    console.log(error);
    if (error.status < 500) {
      res.status(error.status).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error", error });
    }
  }
});

export default clubController;
