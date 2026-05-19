const jwt = require('jsonwebtoken');
const User = require('../models/user');

const authMiddleware = async (req, res, next) => {
    try {
        const cookie = req.cookies['jwt'];
        if (!cookie) {
            return res.status(401).send({ message: 'unauthenticated' });
        }

        const claims = jwt.verify(cookie, process.env.jwtsecret || 'secret');
        if (!claims) {
            return res.status(401).send({ message: 'unauthenticated' });
        }

        const user = await User.findOne({ _id: claims._id });
        if (!user) {
            return res.status(401).send({ message: 'unauthenticated' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).send({ message: 'unauthenticated' });
    }
};

const adminMiddleware = async (req, res, next) => {
    try {
        const cookie = req.cookies['jwt'];
        if (!cookie) {
            return res.status(401).send({ message: 'unauthenticated' });
        }

        const claims = jwt.verify(cookie, process.env.jwtsecret || 'secret');
        if (!claims) {
            return res.status(401).send({ message: 'unauthenticated' });
        }

        const user = await User.findOne({ _id: claims._id });
        if (!user || !user.is_admin) {
            return res.status(401).send({ message: 'unauthenticated' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).send({ message: 'unauthenticated' });
    }
};

module.exports = { authMiddleware, adminMiddleware };
