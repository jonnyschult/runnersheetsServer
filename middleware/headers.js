const headers = (req, res, next) => {
  res.header("access-control-allow-origin", "*");
  res.header("access-control-allow-methods", "GET, POST, PUT, DELETE");
  res.header("access-control-allow-headers", "Content-Type, Authorization");

  next();
};

module.exports = headers;
