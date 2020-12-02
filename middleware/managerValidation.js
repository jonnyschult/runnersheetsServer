const { TeamRoster } = require("../models");

const managerValidation = async (req, res, next) => {
  try {
    if (req.method == "OPTIONS") {
      next();
    } else {
      const teamRole = await TeamRoster.findOne({
        where: { userId: req.user.id, role: "manager" },
      });
      if (teamRole) {
        next();
      } else {
        res
          .status(401)
          .json({ message: "Must be a manager to perform this action." });
      }
    }
  } catch (err) {
    res.status(500).json({
      message: "Must be a coach or a manager to perform this action.",
      err,
    });
  }
};

module.exports = managerValidation;
