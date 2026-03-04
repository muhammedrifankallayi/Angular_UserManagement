const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = async (req, res, next) => {
    try {
        const cookie = req.cookies['jwt'];
        if (!cookie) {
            return res.status(401).send({
                message: 'unauthenticated'
            });
        }

        const claims = jwt.verify(cookie, process.env.JWT_SECRET || 'secret');
        if (!claims) {
            return res.status(401).send({
                message: 'unauthenticated'
            });
        }

        const user = await User.findOne({ _id: claims._id });
        if (!user || !user.is_admin) {
            return res.status(401).send({
                message: 'unauthenticated'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).send({
            message: 'unauthenticated'
        });
    }
};

module.exports = auth;
