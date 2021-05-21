"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../db"));
const models_1 = require("../models");
const roleValidator = async (user_id, group_id, roles, table) => {
    let valArray = [];
    let index = 1;
    let queryString = "";
    let rolesString = "";
    for (const role of roles) {
        if (index == 1) {
            rolesString += `role = $${index}`;
            valArray.push(role);
            index++;
        }
        else {
            rolesString += ` OR role = $${index}`;
            valArray.push(role);
            index++;
        }
    }
    if (table === "teams_users") {
        queryString = `SELECT * FROM ${table} WHERE teams_users.team_id = ${group_id} AND teams_users.user_id = ${user_id} AND (${rolesString})`;
    }
    if (table === "clubs_users") {
        queryString = `SELECT * FROM ${table} WHERE clubs_users.club_id = ${group_id} AND clubs_users.user_id = ${user_id} AND  (${rolesString})`;
    }
    const validManagerResults = await db_1.default.query(queryString, valArray);
    if (validManagerResults.rowCount === 0) {
        throw new models_1.CustomError(401, "User does not have privileges to perform this action.");
    }
    return true;
};
exports.default = roleValidator;
