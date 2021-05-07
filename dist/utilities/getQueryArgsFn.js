"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const getQueryArgs = (queryType, table, info, id) => {
    if (queryType === "update") {
        if (info.id) {
            delete info.id;
        }
        let valArray = [];
        let index = 1;
        let setString = "";
        for (const property in info) {
            const key = property;
            if (index === 1) {
                setString += `${property} = $${index}`;
            }
            else {
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
        let valArray = [];
        let index = 1;
        let columns = "";
        let values = "";
        for (const property in info) {
            const key = property;
            if (index == 1) {
                columns += `${property}`;
                values += `$${index} `;
                valArray.push(info[key]);
                index++;
            }
            else {
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
        let valArray = [];
        let index = 1;
        var check = Object.keys(info)[0];
        let key = check;
        if (info[key]) {
            let wheres = "";
            for (const property in info) {
                const key = property;
                if (index == 1) {
                    wheres += `${property} = $${index}`;
                    valArray.push(info[key]);
                    index++;
                }
                else {
                    wheres += ` AND ${property} = $${index}`;
                    valArray.push(info[key]);
                    index++;
                }
            }
            let queryString = `SELECT * FROM ${table} WHERE ${wheres}`;
            return [queryString, valArray];
        }
        else {
            let queryString = `SELECT * FROM ${table}`;
            return [queryString, valArray];
        }
    }
    if (queryType === "delete") {
        let valArray = [];
        let index = 1;
        let wheres = "";
        for (const property in info) {
            const key = property;
            if (index == 1) {
                wheres += `${property} = $${index}`;
                valArray.push(info[key]);
                index++;
            }
            else {
                wheres += ` AND ${property} = $${index}`;
                valArray.push(info[key]);
                index++;
            }
        }
        let queryString = `DELETE FROM ${table} WHERE ${wheres}`;
        return [queryString, valArray];
    }
    throw new models_1.CustomError(400, "Failed to generate query arguments");
};
exports.default = getQueryArgs;
