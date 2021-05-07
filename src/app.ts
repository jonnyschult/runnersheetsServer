import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import { headers } from "./middleware/index";
import {
  userController,
  activityController,
  teamController,
  fitbitController,
  clubController,
} from "./controllers/index";

const app = express();

app.use(express.json());
app.use(headers);

app.use("/users", userController);
app.use("/fitbit", fitbitController);
app.use("/activities", activityController);
app.use("/team", teamController);
app.use("/club", clubController);

app.listen(process.env.PORT, () => {
  console.log(`Listening on ${process.env.PORT}`);
});
