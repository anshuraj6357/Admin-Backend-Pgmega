
const Signup = require("../model/user")
const Wishlist = require("../model/wishlist")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const { sendForgotPasswordMail } = require('../utils/mail')
const crypto = require('crypto')
const { Uploadmedia, deletemedia } = require("../utils/cloudinary")


const signupcontroller = async (req, res) => {
    console.log("req.body", req.body)
    try {
        const { email, username, password, role } = req.body;
        if (!email || !username || !password) {
            return res.status(400).json({
                success: false,
                message: 'please filled all the data carefully'
            })
        }

        const existinguser = await Signup.findOne({ email: email });
        if (existinguser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            })
        }


        let hashedpassword;
        try {
            hashedpassword = await bcrypt.hash(password, 10);

        } catch (error) {

            return res.status(500).json({
                success: false,
                message: " Internal server error while hashing the password"
            })

        }


        const User = await Signup.create({
            email,
            username,
            password: hashedpassword,
            role
        })
        console.log("User", User)

        return res.status(200).json({
            success: true,
            message: 'user registered successfully',
        })



    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: "Internal sever error"
        })
    }
}
// --------------------------------------------
// ADD OR REMOVE FROM WISHLIST (TOGGLE)
// --------------------------------------------
 const toggleWishlist = async (req, res) => {
  try {
    console.log(req.body)
    const userId = req.user._id;
    const { pgId } = req.body;

    if (!pgId) {
      return res.status(400).json({ message: "PG ID is required" });
    }

    // check if exists
    const exists = await Wishlist.findOne({ userId, pgId });

    if (exists) {
      await Wishlist.deleteOne({ userId, pgId });
      return res.json({ success: true, message: "Removed from wishlist" });
    }

    // add
    const newItem = await Wishlist.create({ userId, pgId });
    return res.json({ success: true, message: "Added to wishlist", data: newItem });

  } catch (error) {
    console.error("Wishlist toggle error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};


// --------------------------------------------
// GET USER WISHLIST
//---------------------------------------------
 const getWishlist = async (req, res) => {
  try {
    const userId = req.user._id;

    const items = await Wishlist.find({ userId });
    console.log(items)

    res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error("Fetch wishlist error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};




const Logincontroller = async (req, res) => {
    console.log("req.body", req.body)
    const { email, password, role } = req.body;

    try {

        if (!email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: "please filled all the data carefully"
            })
        }




        const existingUser = await Signup.findOne({ email });



        if (!existingUser) {
            return res.status(400).json({
                success: false,
                message: "user not found with this details",
            })
        }

        console.log(existingUser)








        const ispasswordcorrect = await bcrypt.compare(password, existingUser.password);
        if (!ispasswordcorrect) {
            return res.status(400).json({
                success: false,
                message: "Incorrect password filled ",
            })
        }

        if (role !== existingUser.role) {
            return res.status(400).json({
                success: false,
                message: "Your role is Not valid",
            })
        }


        const payload = {
            id: existingUser._id,
            name: existingUser.username,
            email: existingUser.email,
            role: existingUser.role,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
            expiresIn: "24h"
        })
        const options = {
            path: "/",
            expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
            httpOnly: true,
            secure: true,
            sameSite: "none"
        };

        res.cookie("babbarCookie", token, options).status(200).json({
            success: true,
            token,
            existingUser,
            message: "User logged in successfully",
        });







    } catch (error) {
        console.log(error)

        return res.status(500).json({
            success: false,
            message: "internal server error",
        })

    }
}



const Logoutcontroller = async (req, res) => {
    try {

        res.clearCookie('babbarCookie', {
            httpOnly: true,
            sameSite: 'none',
            path: '/', // if used during set
        });


        return res.status(200).json({
            success: true,
            message: "logout successfullly"
        })




    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "error in while getting logout"
        })
    }
}



const GetUserProfile = async (req, res) => {
    try {
        const userid = req.user.id;

        const profile = await Signup.findById(userid)


        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "User profile fetched successfully",
            profile,
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: "Error occurred while fetching profile",
        });
    }
};






const forgotUser = async (req, res) => {

    try {
        const { email } = req.body;
        const founduser = await Signup.findOne({ email });
        console.log("founduser", founduser)
        if (!founduser) {
            return res.status(400).json({
                success: false,
                message: `not found the use with this email`
            })
        }
        const resetSession = Date.now() + 360000;
        const resetLink = await crypto.randomBytes(32).toString('hex');
        const finalresetlink = `https://smart-resume-reviewer.vercel.app/forgotresumepassword/${resetLink}`
        founduser.resetSession = resetSession;
        founduser.resetLink = resetLink;
        await founduser.save();
        await sendForgotPasswordMail(email, founduser.username, finalresetlink)


        return res.status(200).json({
            success: true,
            message: `mail send successfully`
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            messaeg: `Internal server error`
        })

    }

}



const checkmail = async (req, res) => {

    try {

        const { password, confermpassword } = req.body;
        const { resettoken } = req.params;
        console.log(resettoken)

        if (!password || !confermpassword) {
            return res.status(400).json({
                success: false,
                message: `plesae fill the filled `,
            })
        }
        if (password != confermpassword) return res.status(400).json({
            success: false,
            message: `passowrd filled carefully`
        })
        const user = await Signup.findOne({ resetLink: resettoken, resetSession: { $gt: Date.now() } });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: `not able to find the user`,
            })
        }


        const encryptedpassword = await bcrypt.hash(password, 10);

        user.password = encryptedpassword;
        user.resetSession = undefined;
        user.resetLink = undefined;


        await user.save();

        return res.status(200).json({
            success: true,
            messge: 'passsword change successfully '
        })




    } catch (error) {
        console.log("error", error);
        res.status(500).json({
            success: false,
            message: `intrnal server error`,
        })

    }
}
module.exports = { signupcontroller,getWishlist,toggleWishlist, GetUserProfile, Logincontroller, Logoutcontroller, forgotUser, checkmail };
