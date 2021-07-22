import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import { headers } from "./middleware/index";
import {
  userRouter,
  activityRouter,
  teamRouter,
  fitbitRouter,
  clubRouter,
  stravaRouter,
  demoRouter,
} from "./routes";

const app = express();

app.use(express.json());
app.use(headers);

app.use("/users", userRouter);
app.use("/fitbit", fitbitRouter);
app.use("/strava", stravaRouter);
app.use("/activities", activityRouter);
app.use("/teams", teamRouter);
app.use("/clubs", clubRouter);
app.use("/demo", demoRouter);

app.listen(process.env.PORT, () => {
  console.log(`Listening on ${process.env.PORT}`);
});
