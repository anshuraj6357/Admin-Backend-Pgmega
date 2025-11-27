const express = require("express");
const router = express.Router();
const { Validate } = require("../middleware/uservalidate");

const {
    getAllbranchPayments,
    createPayment,
    createExpense,
    RevenueDetails
} = require("../controller/payment");

console.log("hiidc")

router.get("/allpayment", Validate, getAllbranchPayments);
router.post("/create", Validate, createPayment);
router.post("/create/expense", Validate, createExpense);
router.get("/getdetails", Validate, RevenueDetails);






module.exports = router;