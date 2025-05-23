var express = require("express");
var router = express.Router();
const MySql = require("../routes/utils/MySql");
const DButils = require("../routes/utils/DButils");
const bcrypt = require("bcrypt");

router.post("/Register", async (req, res, next) => {
  try {
    // parameters exists
    // valid parameters
    // username exists
    let user_details = {
      username: req.body.username,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      country: req.body.country,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
      email: req.body.email,
      profilePic: req.body.profilePic
    }
    let users = [];
    users = await DButils.execQuery("SELECT username from users");

    // Confirm password check
    if (user_details.password !== user_details.confirmPassword)
      throw { status: 400, message: "Password confirmation does not match" };

    // Validate username
    if (!/^[A-Za-z]{3,8}$/.test(user_details.username))
      throw { status: 400, message: "Username must be 3-8 letters only" };

    // Validate password
    if (!/^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{5,10}$/.test(user_details.password))
      throw {
        status: 400,
        message: "Password must be 5-10 chars, with at least one number and one special char"
      };

    if (users.find((x) => x.username === user_details.username))
      throw { status: 409, message: "Conflict (username already exists)" };

    // add the new username
    let hash_password = bcrypt.hashSync(
        user_details.password,
        parseInt(process.env.bcrypt_saltRounds)
    );

    await DButils.execQuery(
        `INSERT INTO users (username, firstname, lastname, country, password, email, profilePic) VALUES ('${user_details.username}', '${user_details.firstname}', '${user_details.lastname}',
                                                                                                         '${user_details.country}', '${hash_password}', '${user_details.email}', '${user_details.profilePic}')`
    );
    res.status(201).send({ message: "user created", success: true });
  } catch (error) {
    next(error);
  }
});

router.post("/Login", async (req, res, next) => {
  try {
    // check that email exists
    const users = await DButils.execQuery("SELECT email FROM users");
    if (!users.find((x) => x.email === req.body.email))
      throw { status: 401, message: "Email or Password incorrect" };

    // check that the password is correct
    const user = (
        await DButils.execQuery(
            `SELECT * FROM users WHERE email = '${req.body.email}'`
        )
    )[0];

    if (!bcrypt.compareSync(req.body.password, user.password)) {
      throw { status: 401, message: "Email or Password incorrect" };
    }

    // Set cookie
    req.session.user_id = user.user_id;
    console.log("session user_id login: " + req.session.user_id);

    // return cookie
    res.status(200).send({ username: user.username });
  } catch (error) {
    next(error);
  }
});

router.post("/Logout", function (req, res) {
  console.log("session user_id Logout: " + req.session.user_id);
  req.session.reset(); // reset the session info --> send cookie when  req.session == undefined!!
  res.send({ success: true, message: "logout succeeded" });
});

module.exports = router;