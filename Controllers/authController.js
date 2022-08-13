const bcrypt = require("bcryptjs");
const User = require("../Model/User");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

exports.postSignup = async (req, res, next) => {
    const errors = validationResult(req).array();
    try {
        if (errors.length > 0) {
            return res.status(422).json({ errors: errors });
        }
        const name = req.body.name;
        const email = req.body.email;
        const password = req.body.password;
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({ name, email, password: hashedPassword });
        const result = await user.save();
        res.status(201).json({
            user: { _id: result._id, username: result.name },
        });
    } catch (err) {
        console.log(err);
    }
};

exports.postLogin = async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    try {
        const user = await User.findOne({ email: email });
        if (!user) {
            throw new Error("Invalid email or password");
        } else {
            const fetchedUser = user;
            bcrypt.compare(password, fetchedUser.password).then((isEqual) => {
                if (!isEqual) {
                    return res.status(401).json({
                        error: "Invalid Email or password",
                    });
                }
                const token = jwt.sign(
                    { email: fetchedUser.email, id: fetchedUser._id },
                    process.env.SECRET_KEY
                );
                res.status(200).json({
                    token: token,
                    user: {
                        email: fetchedUser.email,
                        username: fetchedUser.name,
                        id: fetchedUser._id,
                        createdAt: fetchedUser.createdAt,
                    },
                });
            });
        }
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};
