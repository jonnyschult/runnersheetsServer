"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../db"));
const validation = async (req, res, next) => {
    if (req.method == "OPTIONS") {
        next();
    }
    else {
        let userToken = req.headers.authorization;
        if (!userToken) {
            return res.status(403).send({ authorized: false, message: "Must provide token." });
        }
        else {
            await jsonwebtoken_1.default.verify(userToken, process.env.JWT_SECRET, async (err, decoded) => {
                if (err) {
                    res.status(401).json({ message: "Problem with token", err });
                }
                if (decoded) {
                    await db_1.default.query("SELECT * FROM users WHERE id = $1", [decoded.id], (err, result) => {
                        if (err) {
                            res.status(500).json({ message: "Internal Server Error", err });
                        }
                        if (result.rowCount == 0) {
                            res.status(401).json({ message: "No user with that token." });
                        }
                        else {
                            const user = result.rows[0];
                            req.user = user;
                            next();
                        }
                    });
                }
            });
        }
    }
};
exports.default = validation;
