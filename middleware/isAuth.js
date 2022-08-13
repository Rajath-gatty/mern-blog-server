const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    const headerToken = req.get("Authorization").split(" ")[1];
    if (!headerToken) {
        return res.status(401).json({ error: "Not Authorized" });
    }
    let decodedToken;
    try {
        decodedToken = jwt.verify(headerToken, process.env.SECRET_KEY);
        req.id = decodedToken.id;
    } catch (err) {
        return res.status(401).json({ message: "not authorized", error: err });
    }
    next();
};
