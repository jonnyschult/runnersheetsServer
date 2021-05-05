"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const headers = (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return next();
};
exports.default = headers;
