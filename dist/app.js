"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const express_1 = __importDefault(require("express"));
const index_1 = require("./middleware/index");
const index_2 = require("./controllers/index");
const app = express_1.default();
app.use(express_1.default.json());
app.use(index_1.headers);
app.use("/users", index_2.userController);
app.use("/fitbit", index_2.fitbitController);
app.use("/activities", index_2.activityController);
app.use("/team", index_2.teamController);
app.use("/club", index_2.clubController);
app.listen(process.env.PORT, () => {
    console.log(`Listening on ${process.env.PORT}`);
});
