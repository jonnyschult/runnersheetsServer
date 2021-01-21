const { ClubRoster } = require("../models");
const { Op } = require("sequelize");

const viceChairValidation = async (req, res, next) => {
  try {
    if (req.method == "OPTIONS") {
      next();
    } else {
      const clubRole = await ClubRoster.findOne({
        where: { userId: req.user.id, role: { [Op.or]: ["chairperson", "vice chairperson"] } },
      });
      if (clubRole) {
        next();
      } else {
        res.status(401).json({
          message: "Must be a vice chairperson or a chairperson to perform this action.",
        });
      }
    }
  } catch (err) {
    res.status(500).json({
      message: "Must be a vice chairperson or a chairperson to perform this action.",
      err,
    });
  }
};

module.exports = viceChairValidation;
