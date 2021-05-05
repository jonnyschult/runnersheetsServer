import * as dotenv from "dotenv";
dotenv.config();
import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import pool from "../db";
import { User, RequestWithUser } from "../models";

const validation = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  if (req.method == "OPTIONS") {
    next();
  } else {
    let userToken = req.headers.authorization;
    if (!userToken) {
      return res.status(403).send({ authorized: false, message: "Must provide token." });
    } else {
      await jwt.verify(userToken, process.env.JWT_SECRET!, async (err, decoded) => {
        if (err) {
          res.status(401).json({ message: "Problem with token", err });
        }
        if (decoded) {
          await pool.query(
            "SELECT * FROM users WHERE id = $1",
            [(decoded as { id: string }).id],
            (err, result) => {
              if (err) {
                res.status(500).json({ message: "Internal Server Error", err });
              }
              if (result.rowCount == 0) {
                res.status(401).json({ message: "No user with that token." });
              } else {
                const user: User = result.rows[0];
                req.user = user;
                next();
              }
            }
          );
        }
      });
    }
  }
};

export default validation;
