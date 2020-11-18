const { TeamRoster } = require("../models");

const managerValidation = async (req, res, next) => {
  const teamMember = await TeamRoster.findOne({
    where: { userId: req.user.id },
  });
  if (teamMember.role === "manager") {
    next();
  } else {
    res
      .status(401)
      .send({ error: "Must be a manager to perform this action." });
  }
};

module.exports = managerValidation;
