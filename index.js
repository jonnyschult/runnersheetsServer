require("dotenv").config();

const express = require("express");
const app = express();
const sequelize = require("./db");
const {
  userController,
  activityController,
  teamController,
  coachController,
  managerController,
  fitbitController,
  chairpersonController,
  viceChairController,
} = require("./controllers");
const {
  coachValidation,
  managerValidation,
  userValidation,
  headers,
  chairpersonValidation,
  viceChairValidation,
} = require("./middleware");
const {
  Club,
  ClubRoster,
  Team,
  User,
  TeamRoster,
  Activity,
} = require("./models");
const clubController = require("./controllers/clubController");

app.use(express.json());
app.use(headers);

/*********************
    OPEN ROUTES
*********************/

app.use("/user", userController);

/*********************
    AUTHORIZED ROUTES
*********************/

app.use("/fitbit", userValidation, fitbitController);

app.use("/activity", userValidation, activityController);

app.use("/team", userValidation, teamController);

app.use("/club", userValidation, clubController);

app.use("/coach", userValidation, coachValidation, coachController);

app.use("/manager", userValidation, managerValidation, managerController);

app.use("/viceChair", userValidation, viceChairValidation, viceChairController);

app.use(
  "/chairperson",
  userValidation,
  chairpersonValidation,
  chairpersonController
);

/*********************
    DB CONNECTION
*********************/

sequelize
  .authenticate()
  .then(() => {
    console.log("Connected");
    sequelize.sync();
  })
  .catch((err) => {
    console.error("Unable to connect to the DB", err);
  });

Team.belongsToMany(User, {
  through: TeamRoster,
  onDelete: "cascade",
});
User.belongsToMany(Team, { through: TeamRoster });
Club.belongsToMany(User, {
  through: ClubRoster,
  onDelete: "cascade",
});
User.belongsToMany(Club, { through: ClubRoster });
User.hasMany(Activity);

app.listen(process.env.PORT, () => {
  console.log(`app is listening on port ${process.env.PORT}`);
});
