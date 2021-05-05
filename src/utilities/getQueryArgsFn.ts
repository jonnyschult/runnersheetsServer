import { User, Activity, Club, ClubRoster, Team, TeamRoster } from "../models";

type queries = "insert" | "update" | "select" | "delete";

type Info = User | Activity | ClubRoster | Club | Team | TeamRoster | { id?: number };

const getQueryArgs: (queryType: queries, table: string, info: Info, id?: number) => [string, any[]] = (
  queryType,
  table,
  info,
  id
) => {
  if (queryType === "update") {
    if (info.id) {
      delete info.id;
    }

    let valArray: any[] = [];
    let index: number = 1;
    let setString: string = "";

    for (const property in info) {
      const key = property as keyof Info;
      if (index === 1) {
        setString += `${property} = $${index}`;
      } else {
        setString += `, ${property} = $${index}`;
      }
      valArray.push(info[key]);
      index++;
    }

    let queryString = `UPDATE ${table} SET ${setString} WHERE id = ${id} RETURNING *`;
    return [queryString, valArray];
  }

  if (queryType === "insert") {
    if (info.id) {
      delete info.id;
    }
    let valArray: any[] = [];
    let index: number = 1;
    let columns: string = "";
    let values: string = "";
    for (const property in info) {
      const key = property as keyof Info;
      if (index == 1) {
        columns += `${property}`;
        values += `$${index} `;
        valArray.push(info[key]);
        index++;
      } else {
        columns += `, ${property}`;
        values += `, $${index} `;
        valArray.push(info[key]);
        index++;
      }
    }

    let queryString = `INSERT INTO ${table} (${columns}) VALUES(${values}) RETURNING *`;
    return [queryString, valArray];
  }

  if (queryType === "select") {
    let valArray: any[] = [];
    let index: number = 1;
    var check: string = Object.keys(info)[0];
    let key = check as keyof Info;

    if (info[key]) {
      let wheres: string = "";
      for (const property in info) {
        const key = property as keyof Info;
        if (index == 1) {
          wheres += `${property} = $${index}`;
          valArray.push(info[key]);
          index++;
        } else {
          wheres += ` AND ${property} = $${index}`;
          valArray.push(info[key]);
          index++;
        }
      }

      let queryString = `SELECT * FROM ${table} WHERE ${wheres}`;
      return [queryString, valArray];
    } else {
      let queryString = `SELECT * FROM ${table}`;
      return [queryString, valArray];
    }
  }

  if (queryType === "delete") {
    let valArray: any[] = [];
    let index: number = 1;

    let wheres: string = "";
    for (const property in info) {
      const key = property as keyof Info;
      if (index == 1) {
        wheres += `${property} = $${index}`;
        valArray.push(info[key]);
        index++;
      } else {
        wheres += ` AND ${property} = $${index}`;
        valArray.push(info[key]);
        index++;
      }
    }

    let queryString = `DELETE FROM ${table} WHERE ${wheres}`;
    return [queryString, valArray];
  }

  return ["", []];
};

export default getQueryArgs;
