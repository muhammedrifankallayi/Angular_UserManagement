const dotenv = require('dotenv');
dotenv.config();

const { Router } = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const adminrouter = Router();
const bcrypt = require('bcryptjs');

const verifyToken = (req, res, next) => {
    try {
        const cookie = req.cookies["jwt"];
        if (!cookie) {
            return res.status(401).send({
                message: "unauthenticated"
            });
        }
        const claims = jwt.verify(cookie, process.env.jwtsecret);
        if (!claims) {
            return res.status(401).send({
                message: "unauthenticated"
            });
        }
        req.user_id = claims._id;
        next();
    } catch (error) {
        return res.status(401).send({
            message: "unauthenticated"
        });
    }
}

const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findOne({ _id: req.user_id });
        if (!user || !user.is_admin) {
            return res.status(403).send({
                message: "Forbidden: Admin access required"
            });
        }
        next();
    } catch (error) {
        return res.status(401).send({
            message: "unauthenticated"
        });
    }
}

adminrouter.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email, is_admin: true });
        if (!user) {
            return res.status(400).send({
                message: "User not found"
            })
        }

        if (!(await bcrypt.compare(req.body.password, user.password))) {
            return res.status(400).send({
                message: "Password is Incorrect"
            })
        }

        const token = jwt.sign({ _id: user._id }, process.env.jwtsecret);

        res.cookie("jwt", token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000
        })

        res.send({
            message: "success"
        })
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ message: "Internal Server Error" });
    }
})

adminrouter.post('/logout', async (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 0 })
        res.send({
            message: "success"
        })
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error" });
    }
})

adminrouter.get('/active', verifyToken, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.user_id })
        if (!user) {
            return res.status(401).send({
                message: "unauthenticated"
            })
        }
        const { password, ...data } = await user.toJSON();
        res.send(data)
    } catch (error) {
        return res.status(401).send({
            message: "unauthenticated"
        })
    }
})

adminrouter.get('/users', verifyToken, isAdmin, async (req, res) => {
    try {
        const users = await User.find({})
        const sanitizedUsers = users.map(user => {
            const { password, ...data } = user.toObject();
            return data;
        });
        res.send(sanitizedUsers)
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ message: "Internal Server Error" });
    }
})

adminrouter.post('/deleteUser/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const deleteUser = await User.deleteOne({ _id: req.params.id });
        if (!deleteUser.deletedCount) {
            return res.status(400).send({
                message: "Deletion went wrong"
            })
        }
        res.send(deleteUser);
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error" });
    }
})

adminrouter.post('/editDetails/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const userData = await User.findOne({ _id: req.params.id });
        if (!userData) {
            return res.status(404).send({
                message: "User not found"
            })
        }
        const { password, ...data } = await userData.toJSON();
        res.send(data);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ message: "Internal Server Error" });
    }
})

adminrouter.post('/editUser', verifyToken, isAdmin, async (req, res) => {
    try {
        let name = req.body.name;
        await User.updateOne({ email: req.body.email }, { $set: { name: name } });
        res.send({
            message: "success"
        })
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ message: "Internal Server Error" });
    }
})

adminrouter.post('/createuser', verifyToken, isAdmin, async (req, res) => {
    try {
        let email = req.body.email;
        let password = req.body.password;
        let name = req.body.name;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const record = await User.findOne({ email: email });

        if (record) {
            return res.status(400).send({
                message: "Email is already registered"
            })
        } else {
            const user = new User({
                name: name,
                email: email,
                password: hashedPassword
            })
            await user.save();

            res.send({
                message: "success"
            })
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ message: "Internal Server Error" });
    }
})

module.exports = adminrouter;
