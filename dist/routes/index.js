"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stravaRouter = exports.clubRouter = exports.fitbitRouter = exports.teamRouter = exports.activityRouter = exports.userRouter = void 0;
const userRoute_1 = __importDefault(require("./userRoute"));
exports.userRouter = userRoute_1.default;
const activityRoute_1 = __importDefault(require("./activityRoute"));
exports.activityRouter = activityRoute_1.default;
const teamRoute_1 = __importDefault(require("./teamRoute"));
exports.teamRouter = teamRoute_1.default;
const fitbitRoute_1 = __importDefault(require("./fitbitRoute"));
exports.fitbitRouter = fitbitRoute_1.default;
const clubRoute_1 = __importDefault(require("./clubRoute"));
exports.clubRouter = clubRoute_1.default;
const stravaRoute_1 = __importDefault(require("./stravaRoute"));
exports.stravaRouter = stravaRoute_1.default;
