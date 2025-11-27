const express = require("express");
const router = express.Router();
const {Validate} = require("../middleware/uservalidate");

const {
    signupcontroller,forgotUser,checkmail,
    Logincontroller,Logoutcontroller,GetUserProfile
} = require("../controller/user");


router.post("/register", signupcontroller);
router.post("/forgotpassword",forgotUser)
router.post("/forgotresumepassword/:resettoken",checkmail)
router.post("/login", Logincontroller)
router.get("/profile",Validate, GetUserProfile)
router.get("/logout",Validate,Logoutcontroller)


module.exports = router;