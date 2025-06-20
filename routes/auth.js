var express = require("express");
var router = express.Router();
const MySql = require("../routes/utils/MySql");
const DButils = require("../routes/utils/DButils");
const bcrypt = require("bcrypt");

router.post("/register", async (req, res, next) => {
  try {
    let user_details = {
      username: req.body.username,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      country: req.body.country,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
      email: req.body.email,
      profilePic: req.body.profilePic
    };

    const users = await DButils.execQuery("SELECT username FROM users");

    if (user_details.password !== user_details.confirmPassword)
      throw { status: 400, message: "Password confirmation does not match" };

    if (!/^[A-Za-z]{3,8}$/.test(user_details.username))
      throw { status: 400, message: "Username must be 3–8 letters only" };

    if (!/^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{5,10}$/.test(user_details.password))
      throw {
        status: 400,
        message: "Password must be 5–10 chars, with at least one number and one special char"
      };

    if (users.find((x) => x.username === user_details.username))
      throw { status: 409, message: "Username already exists" };

    let hash_password = bcrypt.hashSync(
        user_details.password,
        parseInt(process.env.bcrypt_saltRounds)
    );

    await DButils.execQuery(`
      INSERT INTO users (username, firstname, lastname, country, password, email, profilePic)
      VALUES ('${user_details.username}', '${user_details.firstname}', '${user_details.lastname}',
              '${user_details.country}', '${hash_password}', '${user_details.email}', '${user_details.profilePic}')
    `);

    res.status(201).send({ message: "User created", success: true });
  } catch (error) {
    next(error);
  }
});

router.post("/Login", async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const users = await DButils.execQuery("SELECT username FROM users");
    if (!users.find((x) => x.username === username))
      throw { status: 401, message: "Username or Password incorrect" };

    const user = (
        await DButils.execQuery(`SELECT * FROM users WHERE username = '${username}'`)
    )[0];

    if (!bcrypt.compareSync(password, user.password)) {
      throw { status: 401, message: "Username or Password incorrect" };
    }

    req.session.user_id = user.user_id;
    console.log("session user_id login: " + req.session.user_id);

    res.status(200).send({ username: user.username });
  } catch (error) {
    next(error);
  }
});

router.post("/Logout", function (req, res) {
  console.log("session user_id logout: " + req.session.user_id);
  req.session.reset();
  res.send({ success: true, message: "Logout succeeded" });
});

module.exports = router;
