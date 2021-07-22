import { RequestWithUser, Team, TeamsUsers, User, CustomError } from "../models";
import { Router } from "express";
import { userValidation } from "../middleware";
import pool from "../db";
import getQueryArgs from "../utilities/getQueryArgsFn";
import roleValidator from "../utilities/roleValidator";

const teamController = Router();

/****************************
    CREATE TEAM
****************************/
teamController.post("/create", userValidation, async (req: RequestWithUser, res, next) => {
  try {
    const info: Team = req.body.info;
    const user = req.user!;

    let [queryString, valArray] = getQueryArgs("insert", "teams", info);

    //Throw custom error if problem with query string.
    if (!queryString) {
      throw new CustomError(400, "Request failed. Data not created. Query parameters problem.");
    }

    //Send INSERT to DB
    const teamResults = await pool.query(queryString, valArray);
    const newTeam: Team = teamResults.rows[0];

    //add manager who created team.
    const teamsUsersInfo: TeamsUsers = { role: "manager", team_id: newTeam.id!, user_id: user.id! };
    const [teamsUsersQuery, teamsUsersArray] = getQueryArgs("insert", "teams_users", teamsUsersInfo);
    if (!teamsUsersQuery) {
      throw new CustomError(400, "Request failed. Data not created. Query parameters problem.");
    }
    const teamsUsersResults = await pool.query(teamsUsersQuery, teamsUsersArray);
    const newTeamRoster: TeamsUsers = teamsUsersResults.rows[0];

    let updatedUser = user;
    if (!user.coach) {
      const userResults = await pool.query("UPDATE users SET coach = true WHERE id = $1 RETURNING *", [
        user.id,
      ]);
      updatedUser = userResults.rows[0];
      console.log(userResults);
    }
    delete updatedUser.passwordhash;
    newTeam.role = newTeamRoster.role;

    res.status(200).json({ message: "Team Created", newTeam, updatedUser });
  } catch (error) {
    console.log(error, "Create Team Route");
    if (error.status < 500) {
      res.status(error.status).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error", error });
    }
  }
});

/***********************
    ADD TEAM ATHLETE
***********************/
teamController.post("/addAthlete", userValidation, async (req: RequestWithUser, res) => {
  try {
    const info = req.body.info;
    const user = req.user!;

    //checks that updater is coach or manager on team, if not, throws error.
    await roleValidator(user.id!, info.team_id, ["manager", "coach"], "teams_users");

    //finds user by email.
    const teamMemberResults = await pool.query("SELECT * FROM users WHERE email = $1", [info.email]);
    if (teamMemberResults.rowCount === 0) {
      throw new CustomError(404, "Request failed. Athlete not found.");
    }
    const teamMember: User = teamMemberResults.rows[0];

    const teamsUsersResults = await pool.query(
      "SELECT * FROM teams_users WHERE user_id = $1 and team_id = $2",
      [teamMember.id, info.team_id]
    );

    if (teamsUsersResults.rowCount > 0) {
      throw new CustomError(401, "Request failed. User already memeber of team.");
    }

    //adds found user to team.
    const queryInfo: TeamsUsers = { role: "athlete", team_id: info.team_id, user_id: teamMember.id! };
    const [queryString, valArray] = getQueryArgs("insert", "teams_users", queryInfo);
    if (!queryString) {
      throw new CustomError(400, "Request failed. Data not created. Query parameters problem.");
    }
    const teamRosterResults = await pool.query(queryString, valArray);
    const newRosterEntry = teamRosterResults.rows[0];

    res.status(200).json({ message: "Athlete added to team", teamMember });
  } catch (error) {
    console.log(error, "Add Team Route");
    if (error.status < 500) {
      res.status(error.status).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error", error });
    }
  }
});

/********************************
    ADD COACH OR MANAGER
 *******************************/
teamController.post("/addCoach", userValidation, async (req: RequestWithUser, res) => {
  try {
    const info = req.body.info;
    const user = req.user!;

    //checks that updater is coach or manager on team, if not, throws error.
    await roleValidator(user.id!, info.team_id, ["manager"], "teams_users");

    //finds user by email.
    const teamMemberResults = await pool.query("SELECT * FROM users WHERE email = $1", [info.email]);
    if (teamMemberResults.rowCount === 0) {
      throw new CustomError(404, "Request failed. User not found.");
    }
    const teamMember: User = teamMemberResults.rows[0];

    const teamsUsersResults = await pool.query(
      "SELECT * FROM teams_users WHERE user_id = $1 and team_id = $2",
      [teamMember.id, info.team_id]
    );

    if (teamsUsersResults.rowCount > 0) {
      throw new CustomError(401, "Request failed. User already memeber of team.");
    }

    //adds found user to team.
    const queryInfo: TeamsUsers = { role: info.role, team_id: info.team_id, user_id: teamMember.id! };
    const [queryString, valArray] = getQueryArgs("insert", "teams_users", queryInfo);
    if (!queryString) {
      throw new CustomError(400, "Request failed. Data not created. Query parameters problem.");
    }
    const teamRosterResults = await pool.query(queryString, valArray);
    const teamsUsersInfo: TeamsUsers = teamRosterResults.rows[0];

    res.status(200).json({
      message: `${teamMember.first_name} was added to the team as a ${teamsUsersInfo.role}.`,
      teamMember,
    });
  } catch (error) {
    console.log(error, "Add Coach or Manager Route");
    if (error.status < 500) {
      res.status(error.status).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error", error });
    }
  }
});

/**************************
    GET TEAM MEMBERS
**************************/
teamController.get("/getTeamMembers/:id", userValidation, async (req: RequestWithUser, res) => {
  try {
    const team_id = +req.params.id;
    const user = req.user!;

    //checks that updater is coach or manager on team, if not, throws error.
    await roleValidator(user.id!, team_id, ["manager", "coach"], "teams_users");

    const athletesResults = await pool.query(
      "SELECT * FROM users INNER JOIN teams_users ON users.id = teams_users.user_id WHERE teams_users.team_id = $1 AND teams_users.role = $2;",
      [team_id, "athlete"]
    );
    const coachesResults = await pool.query(
      "SELECT * FROM users INNER JOIN teams_users ON users.id = teams_users.user_id WHERE teams_users.team_id = $1 AND teams_users.role = $2;",
      [team_id, "coach"]
    );
    const managersResults = await pool.query(
      "SELECT * FROM users INNER JOIN teams_users ON users.id = teams_users.user_id WHERE teams_users.team_id = $1 AND teams_users.role = $2;",
      [team_id, "manager"]
    );

    const athletes: User[] = athletesResults.rows;
    const coaches: User[] = coachesResults.rows;
    const managers: User[] = managersResults.rows;

    res.status(200).json({ message: "Success", athletes, coaches, managers });
  } catch (error) {
    console.log(error, "Get Team Members Route");
    if (error.status < 500) {
      res.status(error.status).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error", error });
    }
  }
});

/**************************
    GET TEAMS
**************************/
teamController.get("/getTeams", userValidation, async (req: RequestWithUser, res) => {
  try {
    const user = req.user!;
    if (!user.coach) {
      throw new CustomError(401, "Must be a coach or manager to receive this data");
    }

    const teamsResults = await pool.query(
      "SELECT * FROM teams INNER JOIN teams_users ON teams.id = teams_users.team_id WHERE teams_users.user_id = $1 AND (teams_users.role = $2 OR teams_users.role = $3);",
      [user.id, "coach", "manager"]
    );
    const teams = teamsResults.rows;
    res.status(200).json({ message: "Success", teams });
  } catch (error) {
    console.log(error, "Get Team Route");
    if (error.status < 500) {
      res.status(error.status).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error", error });
    }
  }
});

/**************************
    GET TEAM ACTIVITIES
**************************/
teamController.get("/getTeamActivities/:id", userValidation, async (req: RequestWithUser, res) => {
  try {
    const team_id: number = +req.params.id;
    const info = req.query;
    const user = req.user!;

    //checks that updater is coach or manager on team, if not, throws error.
    await roleValidator(user.id!, team_id, ["manager", "coach"], "teams_users");

    //gets all athletes activities
    const results = await pool.query(
      "SELECT * FROM activities INNER JOIN teams_users ON activities.user_id = teams_users.user_id WHERE teams_users.team_id = $1 AND (date >= $2 AND date <= $3);",
      [team_id, info.start_date, info.end_date]
    );

    const activities = results.rows;

    res.status(200).json({ message: "Success", activities });
  } catch (error) {
    console.log(error, "Get Team Activities Route");
    if (error.status < 500) {
      res.status(error.status).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error", error });
    }
  }
});

/**************************
    UPDATE ATHLETE INFO
**************************/
teamController.put("/updateAthlete", userValidation, async (req: RequestWithUser, res) => {
  try {
    const info: User = req.body.info;
    const team_id = req.body.team_id;
    const user = req.user!;

    //checks that updater is coach or manager on team, if not, throws error.
    await roleValidator(user.id!, team_id, ["manager", "coach"], "teams_users");

    //checks that updatee is athlete on team
    await roleValidator(info.id!, team_id, ["athlete"], "teams_users");

    //Utility function to get query arguments
    const [queryString, valArray] = getQueryArgs("update", "users", info, info.id!);

    //Pass UPDATE to users table in DB
    const result = await pool.query(queryString, valArray);

    const updatedAthlete = result.rows[0];

    res.status(200).json({ message: "Account Updated!", updatedAthlete });
  } catch (error) {
    console.log(error, "Get Team Activities Route");
    if (error.status < 500) {
      res.status(error.status).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error", error });
    }
  }
});

/********************************
    UPDATE COACH OR MANAGER ROLE
 *******************************/
teamController.put("/updateCoach", userValidation, async (req: RequestWithUser, res) => {
  try {
    const info: TeamsUsers = req.body.info;
    const user = req.user!;

    //checks that updater is coach or manager on team, if not, throws error.
    await roleValidator(user.id!, info.team_id, ["manager"], "teams_users");

    //Ensures that at least one manager remains on the team.
    const manager = await pool.query("SELECT * FROM teams_users WHERE team_id = $1 AND role = $2;", [
      info.team_id,
      "manager",
    ]);
    if (manager.rowCount === 1 && manager.rows[0].user_id === user.id) {
      throw new CustomError(403, "Must be atleast one manager on team.");
    }

    const result = await pool.query(
      `UPDATE teams_users SET role = $1 WHERE team_id = $2 AND user_id = $3 RETURNING *`,
      [info.role, info.team_id, info.user_id]
    );

    const updatedTeamsUsersItem: TeamsUsers = result.rows[0];

    res.status(200).json({ message: "Role Updated", updatedTeamsUsersItem });
  } catch (error) {
    console.log(error, "Update Coach or Manager Role Route");
    if (error.status < 500) {
      res.status(error.status).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error", error });
    }
  }
});

/**************************
    UPDATE TEAM NAME
**************************/
teamController.put("/updateTeam", userValidation, async (req: RequestWithUser, res) => {
  try {
    const info: Team = req.body.info;
    const user = req.user!;

    await roleValidator(user.id!, info.id!, ["manager"], "teams_users");

    //Utility function to get query arguments
    const [queryString, valArray] = getQueryArgs("update", "teams", info, info.id);

    //Pass UPDATE to DB
    const result = await pool.query(queryString, valArray);

    const updatedTeam = result.rows[0];

    res.status(200).json({ message: "Name updated!", updatedTeam });
  } catch (error) {
    console.log(error, "Update Team Name Route");
    if (error.status < 500) {
      res.status(error.status).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error", error });
    }
  }
});

/**************************
    DELETE COACH OR MANAGER
**************************/
teamController.delete("/removeCoach", userValidation, async (req: RequestWithUser, res) => {
  try {
    const info = req.query;
    const user = req.user!;

    //checks that updater is coach or manager on team, if not, throws error.
    await roleValidator(user.id!, +info.team_id!, ["manager"], "teams_users");

    //Ensures that at least one manager remains on the team.
    const manager = await pool.query("SELECT * FROM teams_users WHERE team_id = $1 AND role = $2;", [
      info.team_id,
      "manager",
    ]);
    if (manager.rowCount === 1 && manager.rows[0].user_id === user.id) {
      throw new CustomError(403, "Must be atleast one manager on team.");
    }

    //Send DELETE query to DB
    const results = await pool.query("DELETE FROM teams_users WHERE team_id = $1 AND user_id = $2", [
      info.team_id,
      info.user_id,
    ]);

    const removed = results.rows[0];

    res.status(200).json({ message: `Coach removed from team.`, removed });
  } catch (error) {
    console.log(error, "Delete Coach or Manager Route");
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
teamController.delete("/removeAthlete", userValidation, async (req: RequestWithUser, res) => {
  try {
    const info = req.query;
    const user = req.user!;

    await roleValidator(user.id!, +info.team_id!, ["manager", "coach"], "teams_users");

    //Send DELETE query to users table in DB
    const results = await pool.query("DELETE FROM teams_users WHERE team_id = $1 AND user_id = $2", [
      info.team_id,
      info.athlete_id,
    ]);

    const removed = results.rows[0];

    res.status(200).json({
      message: `Athlete removed from team.`,
      removed,
    });
  } catch (error) {
    console.log(error, "Delete Athlete Route");
    if (error.status < 500) {
      res.status(error.status).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error", error });
    }
  }
});

/**************************
    DELETE TEAM 
**************************/
teamController.delete("/removeTeam/:id", userValidation, async (req: RequestWithUser, res) => {
  try {
    const team_id = +req.params.id;
    const user = req.user!;

    await roleValidator(user.id!, team_id, ["manager"], "teams_users");

    //Gets all coaches and managers associated with a team
    let updatedUser = user;
    const coachesManagersResults = await pool.query(
      "SELECT * FROM users INNER JOIN teams_users ON users.id = teams_users.user_id WHERE teams_users.team_id = $1 AND (teams_users.role = $2 OR teams_users.role = $3);",
      [team_id, "coach", "manager"]
    );
    const coachesManagers: User[] = coachesManagersResults.rows;

    //Send DELETE query to users table in DB
    const results = await pool.query("DELETE FROM teams WHERE id = $1", [team_id]);
    const removed = results.rows[0];

    //Updates user's coach status if the removed team was their only team.
    coachesManagers.forEach(async (coachMang) => {
      const results = await pool.query("SELECT * FROM teams_users WHERE user_id = $1;", [coachMang.id]);
      if (results.rowCount === 0) {
        const userUpdateResults = await pool.query("UPDATE users SET coach = false WHERE id = $1;", [
          coachMang.id,
        ]);
        if (coachMang.id === user.id) {
          updatedUser = userUpdateResults.rows[0];
        }
      }
    });

    res.status(200).json({ message: `Team Removed`, removed });
  } catch (error) {
    console.log(error, "Delete Team Route");
    if (error.status < 500) {
      res.status(error.status).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error", error });
    }
  }
});

export default teamController;
