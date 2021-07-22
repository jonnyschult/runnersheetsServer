import * as dotenv from "dotenv";
dotenv.config();
import { RequestWithUser, CustomError, Activity, Club, ClubsUsers, User } from "../models";
import { Response, Router } from "express";
import { userValidation } from "../middleware";
import pool from "../db";
import getQueryArgs from "../utilities/getQueryArgsFn";
import bcrypt from "bcrypt";

const demoRouter = Router();

/************************
 CREATE ACTIVITIY
************************/
demoRouter.post("/createActivities", userValidation, async (req: RequestWithUser, res) => {
  try {
    const info: any = req.body.info;
    const user = req.user!;

    if (info.password !== process.env.DEMO_PASS) {
      res.status(401).json({ message: "Wrong password." });
    }

    //Create user run data
    const generatedActivities: Activity[] = [];
    let currentDate = new Date().getTime();
    for (let i = 0; i < 150; i++) {
      const meters = 4000 + Math.floor(Math.random() * 15000);
      const avgHR = i % 4 === 0 ? Math.floor(150 + Math.random() * 12) : Math.floor(150 - Math.random() * 12);

      const runObj: Activity = {
        user_id: user.id!,
        date: currentDate,
        distance_meters: meters,
        duration_seconds:
          i % 4 === 0
            ? Math.floor(meters * 0.3 - Math.random() * 500)
            : Math.floor(meters * 0.3 + Math.random() * 500),
        elevation_meters: Math.floor(Math.random() * 103),
        avg_hr: avgHR,
        max_hr: i % 4 === 0 ? Math.floor(avgHR * 1.2) : Math.floor(avgHR * 1.1),
        description: undefined,
      };

      const [queryString, valArray] = getQueryArgs("insert", "activities", runObj);

      //Send INSERT to DB
      const result = await pool.query(queryString, valArray);
      currentDate = currentDate - 86400000 * Math.ceil((Math.random() * 10) / 3);
      generatedActivities.push(result.rows[0]);
    }
    currentDate = new Date().getTime();

    //Create Other users and their run data
    const users = [
      { firstName: "Herbet", lastName: "Lancing", email: "herbythelance@gmail.com", DOB: "08/08/1988" },
      { firstName: "Bearnice", lastName: "Saunders", email: "feelthebearn@gmail.com", DOB: "09/09/1989" },
      { firstName: "Trevor", lastName: "Hofbauer", email: "tallcanadian@gmail.com", DOB: "03/08/1992" },
      { firstName: "Emma", lastName: "Coburn", email: "steeplechaser@gmail.com", DOB: "10/19/1990" },
      { firstName: "Eliud", lastName: "Kipchoge", email: "runnergoat@gmail.com", DOB: "11/05/1984" },
    ];
    let npcUsers: User[] = [];
    for (let i = 0; i < 5; i++) {
      const userObj = {
        email: users[i].email,
        first_name: users[i].firstName,
        last_name: users[i].lastName,
        passwordhash: bcrypt.hashSync("testpass", 10),
        height_inches:
          i % 2 === 0 ? Math.round(58 * (1 + Math.random() / 10)) : Math.round(66 * (1 + Math.random() / 10)),
        weight_pounds:
          i % 2 === 0 ? Math.round(100 * (1 + Math.random() / 3)) : Math.round(120 * (1 + Math.random() / 3)),
        date_of_birth: users[i].DOB,
        premium_user: false,
        coach: false,
      };
      const [queryString, valArray] = getQueryArgs("insert", "users", userObj);
      const result = await pool.query(queryString, valArray);
      const newUser = result.rows[0];
      npcUsers.push(newUser);
      for (let j = 0; j < 150; j++) {
        const meters = 4000 + Math.floor(Math.random() * 15000);
        const avgHR =
          j % 4 === 0 ? Math.floor(150 + Math.random() * 12) : Math.floor(150 - Math.random() * 12);

        const runObj: Activity = {
          user_id: newUser.id!,
          date: currentDate,
          distance_meters: meters,
          duration_seconds:
            j % 4 === 0
              ? Math.floor(meters * 0.3 - Math.random() * 500)
              : Math.floor(meters * 0.3 + Math.random() * 500),
          elevation_meters: Math.floor(Math.random() * 103),
          avg_hr: avgHR,
          max_hr: j % 4 === 0 ? Math.floor(avgHR * 1.2) : Math.floor(avgHR * 1.1),
          description: undefined,
        };

        const [queryString, valArray] = getQueryArgs("insert", "activities", runObj);
        await pool.query(queryString, valArray);
        currentDate = currentDate - 86400000 * Math.ceil((Math.random() * 10) / 3);
      }
      currentDate = new Date().getTime();
    }

    //Create clubs
    const generatedClubs: Club[] = [];
    const clubNames = ["Feel the Bearn TC", "Eliud's Elites", 'Hoi Poloi "Track" Club'];
    for (let i = 0; i < 3; i++) {
      let [queryString, valArray] = getQueryArgs("insert", "clubs", { club_name: clubNames[i] });
      const clubResults = await pool.query(queryString, valArray);
      const newClub: Club = clubResults.rows[0];
      if (i === 0) {
        const clubsUsersInfo: ClubsUsers = { role: "chair", club_id: newClub.id!, user_id: npcUsers[1].id! };
        const [clubsUsersQuery, clubsUsersArray] = getQueryArgs("insert", "clubs_users", clubsUsersInfo);
        await pool.query(clubsUsersQuery, clubsUsersArray);
        const restOfUsers = npcUsers.filter((npc) => npc.first_name === "Emma");
        for (let j = 0; j < restOfUsers.length + 1; j++) {
          const clubsUsersInfo: ClubsUsers = {
            role: "athlete",
            club_id: newClub.id!,
            user_id: j === restOfUsers.length ? user.id! : restOfUsers[j].id!,
          };
          const [clubsUsersQuery, clubsUsersArray] = getQueryArgs("insert", "clubs_users", clubsUsersInfo);
          await pool.query(clubsUsersQuery, clubsUsersArray);
        }
        newClub.role = "athlete";
        generatedClubs.push(newClub);
      } else if (i === 1) {
        const clubsUsersInfo: ClubsUsers = { role: "chair", club_id: newClub.id!, user_id: npcUsers[4].id! };
        const [clubsUsersQuery, clubsUsersArray] = getQueryArgs("insert", "clubs_users", clubsUsersInfo);
        await pool.query(clubsUsersQuery, clubsUsersArray);
        const restOfUsers = npcUsers.filter((npc) => npc.first_name === ("Emma" || "Trevor"));
        for (let j = 0; j < restOfUsers.length + 1; j++) {
          const clubsUsersInfo: ClubsUsers = {
            role: "athlete",
            club_id: newClub.id!,
            user_id: j === restOfUsers.length ? user.id! : restOfUsers[j].id!,
          };
          const [clubsUsersQuery, clubsUsersArray] = getQueryArgs("insert", "clubs_users", clubsUsersInfo);
          await pool.query(clubsUsersQuery, clubsUsersArray);
        }
        newClub.role = "athlete";
        generatedClubs.push(newClub);
      } else {
        const clubsUsersInfo: ClubsUsers = { role: "chair", club_id: newClub.id!, user_id: user.id! };
        const [clubsUsersQuery, clubsUsersArray] = getQueryArgs("insert", "clubs_users", clubsUsersInfo);
        await pool.query(clubsUsersQuery, clubsUsersArray);
        for (let j = 0; j < 5; j++) {
          const clubsUsersInfo: ClubsUsers = {
            role: "athlete",
            club_id: newClub.id!,
            user_id: npcUsers[j].id!,
          };
          const [clubsUsersQuery, clubsUsersArray] = getQueryArgs("insert", "clubs_users", clubsUsersInfo);
          await pool.query(clubsUsersQuery, clubsUsersArray);
        }
        newClub.role = "chair";
        generatedClubs.push(newClub);
      }
    }

    res.status(200).json({
      message: "Success.",
      generatedActivities,
      generatedClubs,
    });
  } catch (error) {
    console.log("In demo route", error);
    if (error.status < 500) {
      res.status(error.status).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error", error });
    }
  }
});

export default demoRouter;
