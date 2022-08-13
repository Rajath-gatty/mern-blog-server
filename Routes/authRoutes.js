const router = require("express").Router();
const { body } = require("express-validator");
const User = require("../Model/User");
const authController = require("../Controllers/authController");

router.post(
    "/signup",
    [
        body("name")
            .trim()
            .isLength({ min: 5 })
            .withMessage("Username must be atleast 5 characters long"),
        body("email")
            .isEmail()
            .withMessage("Enter a valid email address")
            .custom((value) => {
                return User.findOne({ email: value }).then((user) => {
                    if (user) {
                        return Promise.reject(
                            "User already exists with this email"
                        );
                    }
                });
            })
            .normalizeEmail(),
        body("password")
            .trim()
            .isLength({ min: 8 })
            .withMessage("Password must be atleast 8 characters long"),
    ],
    authController.postSignup
);

router.post("/login", authController.postLogin);

module.exports = router;
