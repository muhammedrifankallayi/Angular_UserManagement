const dotenv = require('dotenv');
dotenv.config();

const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const router = Router();
const multer = require('multer');
const upload = multer({ dest: './file' });
const { authMiddleware } = require('../middleware/auth');

const JWT_SECRET = process.env.jwtsecret || 'secret';

router.post('/register', async (req, res) => {
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
            const result = await user.save();

            //jwt token
            const { _id } = await result.toJSON();
            const token = jwt.sign({ _id: _id }, JWT_SECRET);

            res.cookie("jwt", token, {
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000
            })

            res.send({
                message: "success"
            })
        }
    } catch (error) {
        res.status(500).send({ message: "Internal server error" });
    }
})

router.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email })
        if (!user) {
            return res.status(404).send({
                message: "User not found"
            })
        }
        if (!(await bcrypt.compare(req.body.password, user.password))) {
            return res.status(400).send({
                message: "Password is Incorrect"
            })
        }

        const token = jwt.sign({ _id: user._id }, JWT_SECRET);

        res.cookie("jwt", token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000
        })

        res.send({
            message: "success"
        })
    } catch (error) {
        res.status(500).send({ message: "Internal server error" });
    }

})

router.get('/user', authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const { password, ...data } = await user.toJSON()
        res.send(data)
    } catch (error) {
        return res.status(401).send({
            message: 'unauthenticated'
        })
    }
})

router.post('/logout', (req, res) => {
    res.cookie("jwt", "", { maxAge: 0 })
    res.send({
        message: "success"
    })
})

router.post('/profile-upload-single', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        const user = req.user;
        const updateimg = await User.updateOne({ _id: user._id }, { $set: { image: req.file.filename } });
        if (updateimg.modifiedCount > 0) {
            res.status(200).json({ message: 'Image uploaded successfully' });
        } else {
            res.status(400).json({ message: 'Something went wrong or image same' });
        }
    } catch (error) {
        res.status(500).send({ message: "Internal server error" });
    }
})

router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const { password, ...data } = await user.toJSON()
        res.send(data)
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ message: "Internal server error" });
    }
})

module.exports = router