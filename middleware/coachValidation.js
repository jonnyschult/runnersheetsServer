const { TeamRoster } = require("../models");

const coachValidation = async (req, res, next) => {
  const teamMember = await TeamRoster.findOne({
    where: { userId: req.user.id },
  });
  if (teamMember.role === "coach" || teamMember.role === "manager") {
    next();
  } else {
    res
      .status(401)
      .send({ error: "Must be a coach or a manager to perform this action." });
  }
};

module.exports = coachValidation;
