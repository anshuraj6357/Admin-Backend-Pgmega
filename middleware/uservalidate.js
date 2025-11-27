
const Signup = require("../model/user")
const jwt = require("jsonwebtoken")
exports.Validate = async (req, res, next) => {
    console.log("get")
    try {
        const token = req.cookies.babbarCookie;
        console.log(token)

        if (!token) {
            return res.status(400).json({
                success: false,
                message: "not found the token "
            })
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        console.log("decoded",decoded)
        if (!decoded) {
            return res.status(400).json({
                success: false,
                message: "Ivalid token"
            })
        }
        const users = await Signup.findById(decoded.id);
        console.log("grvr",users)
        if (!users) {
            return res.status(400).json({
                success: false,
                message: "User Not Found"
            })
        }
        req.user = users;
        // console.log("grvr")
        console.log("grvr", req.user)
        next();
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })

    }
}

exports.IsBranchmanager = async (req, res, next) => {

    try {
        const role=req.user.role;
        if(role!="branch-manager"){
            return res.status(400).json({
                success:false,
                message:"you are not Authorised to see this page "
            })
        }
        next()
        
    }  catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })

    }
}



exports.IsOwner = async (req, res, next) => {

    try {
        const role=req.user.role;
        if(role!="owner"){
            return res.status(400).json({
                success:false,
                message:"you are not Authorised to see this page "
            })
        }
        next()
        
    }  catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })

    }
}

