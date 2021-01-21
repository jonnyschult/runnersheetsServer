const { ClubRoster } = require("../models");

const chairpersonValidation = async (req, res, next) => {
  try {
    if (req.method == "OPTIONS") {
      next();
    } else {
      const clubRole = await clubRoster.findOne({
        where: { userId: req.user.id, role: "chairperson" },
      });
      if (clubRole) {
        next();
      } else {
        res
          .status(401)
          .json({ message: "Must be a chairperson to perform this action." });
      }
    }
  } catch (err) {
    res.status(500).json({
      message: "Must be a coach or a chairperson to perform this action.",
      err,
    });
  }
};

module.exports = chairpersonValidation;
