import pool from "../db";
import { CustomError } from "../models";
type Roles = "athlete" | "coach" | "manager" | "chair" | "vice_chair";

const roleValidator: (
  user_id: number,
  group_id: number,
  roles: Roles[],
  table: "teams_users" | "clubs_users"
) => Promise<boolean> = async (user_id, group_id, roles, table) => {
  let valArray: any[] = [];
  let index: number = 1;
  let queryString = "";
  let rolesString = "";

  for (const role of roles) {
    if (index == 1) {
      rolesString += `role = $${index}`;
      valArray.push(role);
      index++;
    } else {
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

  const validManagerResults = await pool.query(queryString, valArray);
  if (validManagerResults.rowCount === 0) {
    throw new CustomError(401, "User does not have privileges to access this data.");
  }

  return true;
};

export default roleValidator;
