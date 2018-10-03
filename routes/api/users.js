const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");

// Load user model
const User = require("../../models/User");

// @route   GET api/users/test
// @desc    Tests users route
// @access  Public
router.get("/test", (req, res) =>
  res.json({ msg: "Users test route working" })
);

// @route   POST api/users/register
// @desc    Register User
// @access  Public
router.post("/register", (req, res) =>
  User.findOne({ email: req.body.email }).then(user => {
    if (user) {
      return res.status(400).json({ email: "Email already exists" });
    } else {
      const avatar = gravatar.url(req.body.email, {
        s: "200",
        r: "pg",
        d: "mm"
      });

      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        avatar: avatar,
        password: req.body.password
      });

      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then(user => res.json(user))
            .catch(err => console.log(err));
        });
      });
    }
  })
);

// @route   GET api/users/login
// @desc    Login User and return a WEB TOKEN
// @access  Public
router.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // Find user email
  User.findOne({ email }).then(user => {
    // Check if user exits
    if (!user) {
      return res.status(404).json({ email: "User not found" });
    }

    // Check password of existing user
    bcrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        //res.json({ message: "Success" });
        const payload = { id: user.id, name: user.name, avatar: user.avatar };

        jwt.sign(
          payload,
          keys.secrectOrKey,
          { expiresIn: 3600 },
          (err, TOKEN) => {
            res.json({
              success: true,
              TOKEN: "Bearer " + TOKEN
            });
          }
        );
      } else {
        return res.status(400).json({ password: "Password incorrect" });
      }
    });
  });
});

module.exports = router;
