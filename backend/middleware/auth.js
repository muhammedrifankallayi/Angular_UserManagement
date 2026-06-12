const jwt = require('jsonwebtoken');
const User = require('../models/user');

const verifyToken = (req, res, next) => {
    const cookie = req.cookies["jwt"];
    if (!cookie) {
        return res.status(401).send({
            message: "unauthenticated"
        });
    }

    try {
        const claims = jwt.verify(cookie, process.env.jwtsecret);
        if (!claims) {
            return res.status(401).send({
                message: "unauthenticated"
            });
        }
        req.userId = claims._id;
        next();
    } catch (error) {
        return res.status(401).send({
            message: "unauthenticated"
        });
    }
};

const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findOne({ _id: req.userId });
        if (!user || user.is_admin !== true && user.is_admin !== "true") {
            return res.status(403).send({
                message: "Access denied. Admins only."
            });
        }
        next();
    } catch (error) {
        return res.status(500).send({
            message: "Internal server error"
        });
    }
};

module.exports = {
    verifyToken,
    isAdmin
};
