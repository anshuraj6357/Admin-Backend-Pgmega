const Payment = require("../model/payment")
const PropertyBranch = require("../model/propertyBranch")
const Expense = require("../model/expenses")
const Tenant = require("../model/tenants")
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Signup = require("../model/user")


// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.razorpay_payment_id,        // Your Razorpay Key ID
    key_secret: process.env.RZP_KEY_SECRET // Your Razorpay Key Secret
});


exports.getAllbranchPayments = async (req, res) => {

    try {
        const id = req.user._id;

        const property = await PropertyBranch.find({ branchmanager: id })
        if (property.length <= 0) {
            return res.status(400).json({
                success: true,
                message: "not have any branch"
            })
        }
        let allpayment = [];
        console.log(property)

        for (const branch of property) {
            console.log(branch._id)
            const allbranch = await Payment.find({ branch: branch._id }).populate("tenantId").populate("branch").sort({ createdAt: 1 })

            allpayment.push(...allbranch)




        }
        return res.status(200).json({
            success: true,
            meeesgae: "payment collection report",
            allpayment: allpayment
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "internal server error"
        })

    }
}

exports.createExpense = async (req, res) => {

    try {


        const { category, amount, branchId } = req.body;

        if (!category || !amount || !branchId) {
            return res.status(400).json({
                success: false,
                message: "please Fill all the details"
            })
        }


        const expensecreate = await Expense.create({
            category,
            amount,
            branchId
        })
        return res.status(200).json({
            success: true,
            message: "expense created",
            expenses: expensecreate
        })


    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "internal server error"
        })

    }
}




exports.RevenueDetails = async (req, res) => {

    try {
        const { month, year } = req.query
        id = req.user._id
        let notpaid = []


        const property = await PropertyBranch.find({ branchmanager: id });

        if (property.length <= 0) {
            return res.status(400).json({
                success: false,
                message: "No branches found for this owner",
            });
        }


        const startdate = new Date(year, month - 1, 1)
        const enddate = new Date(year, month, 0, 23, 59, 59);

        let allpayment = [];
        let allExpense = [];

        let tenantpayments = {};

        let expense = 0;
        let rev = 0;
        let totaladvances = 0

        for (const branch of property) {
            const allexpenses = await Expense.find({
                branchId: branch._id,
                createdAt: { $gte: startdate, $lte: enddate }
            }).populate("branchId")

            for (const all of allexpenses) {
                expense += all.amount

            }
            allExpense.push(...allexpenses)





            const allbranch = await Payment.find({
                branch: branch._id,
                createdAt: { $gte: startdate, $lte: enddate }, // filter by month
            }).sort({ createdAt: -1 })
                .populate("tenantId")
                .populate("branch")


            for (const payment of allbranch) {
                const tenantId = payment.tenantId._id.toString()
                if (!tenantpayments[tenantId]) {
                    tenantpayments[tenantId] = {
                        tenant: payment.tenantId,
                        toatadvance: payment.tilldateAdvance
                    }
                } else {
                    tenantpayments[tenantId].toatadvance = Math.max(tenantpayments[tenantId].toatadvance, payment.amountpaid)
                }
                tenantpayments[tenantId].toatadvance -= payment.tenantId.Rent

            }




            for (const allrev of allbranch) {
                rev += allrev.amountpaid
                totaladvances += allrev.tenantId.Rent

            }


            allpayment.push(...allbranch);
            const alltenant = await Tenant.find({
                branch: branch._id
            });
            const paidTenantIds = allbranch.map(p => p.tenantId.toString());
            for (const tenant of alltenant) {
                if (!paidTenantIds.includes(tenant._id.toString())) {
                    notpaid.push(tenant);
                }
            }


        }







        const totalrev = rev - expense


        return res.status(200).json({
            success: true,
            message: `Payment collection report for ${month}-${year}`,
            allpayment,
            allExpense,
            expense: expense,
            Income: rev,
            totalrevenue: totalrev,
            notpaid,
            tenantpayments
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "internal server error"
        })

    }
}



exports.makingpayment = async (req, res) => {

    try {
        const { amount, currency = "INR", receipt } = req.body;

        const options = {
            amount: amount,
            currency,
            receipt: receipt || `receipt_${Date.now()}`,
            payment_capture: 1
        };


        const order = await razorpay.orders.create(options);
        console.log(order)
        return res.json({ success: true, order });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "internal server error"
        })

    }
}



exports.verifying = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            roomId,
            amount
        } = req.body;

        let newTenant = null; // ✅ FIX: define globally so return works

        const generated_signature = crypto
            .createHmac("sha256", process.env.RZP_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        if (generated_signature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Invalid signature"
            });
        }

        const user = await Signup.findById(req.user._id);
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        const branchDoc = await PropertyBranch.findOne({ "rooms._id": roomId });
        if (!branchDoc) return res.status(400).json({ success: false, message: "Branch not found" });

        const room = branchDoc.rooms.id(roomId);
        if (!room) return res.status(400).json({ success: false, message: "Room not found" });

        const name = user.username;
        const roomNumber = room.roomNumber;
        const Rent = room.price || room.rentperday || room.rentperNight || room.rentperhour; // Hotel case
        const branchId = room.branch;

        if (!name || !Rent || !roomNumber || !branchId) {
            return res.status(400).json({ success: false, message: "Required fields missing" });
        }

    
        if (room.category === "Pg") {

            const capacity = room.type === "Double"
                ? 2
                : room.type === "Triple"
                    ? 3
                    : 1;

            const tenantsInRoom = await Tenant.countDocuments({
                branch: branchId,
                status: "Active",
                roomNumber: Number(roomNumber)
            });

            if (tenantsInRoom >= capacity) {
                return res.status(400).json({ success: false, message: "Room already full" });
            }

            if (!room.verified) {
                return res.status(400).json({ success: false, message: "Room is not verified" });
            }

            newTenant = await Tenant.create({
                branch: branchId,
                name,
                Rent,
                dues: 0,
                advanced: 0,
                roomNumber
            });

            room.occupied += 1;
            room.vacant = capacity - room.occupied;

            if (room.occupied >= capacity) {
                 room.availabilityStatus = "Occupied";
                if (!branchDoc.occupiedRoom.includes(Number(roomNumber))) {
                    branchDoc.occupiedRoom.push(Number(roomNumber));
                }
            }
        }

     
        if ((room.category === "Hotel"||room.category === "Rented-Room") && room.occupied === 0) {

            if (!room.verified) {
                return res.status(400).json({ success: false, message: "Room is not verified" });
            }

            newTenant = await Tenant.create({
                branch: branchId,
                name,
                Rent,
                dues: 0,
                advanced: 0,
                roomNumber
            });

            room.occupied = 1;
            room.vacant = 0;
            room.availabilityStatus = "Occupied";
        }
        

        branchDoc.markModified("rooms");
        await branchDoc.save();

       
        await Payment.create({
            tenantId: req.user._id,
            branch: branchId,
            mode: "Online",
            tilldatestatus: "paid",
            amountpaid: amount,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        });

        return res.status(200).json({
            success: true,
            message: "Tenant added + Payment verified successfully",
            tenant: newTenant,
            branch: branchDoc
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

exports.createPayment = async (req, res) => {

    try {
        const { tenantId, branch, amountpaid } = req.body;
        const foundtenant = await Tenant.findById(tenantId);
        const onedaypayment = foundtenant.Rent / 30;
        console.log(foundtenant)
        const releasedays = Math.floor((amountpaid) / onedaypayment)
        console.log("releasedays", releasedays)
        if (!amountpaid || !tenantId || !branch) {
            return res.status(400).json({
                success: false,
                message: "Please enter all the filled"
            })
        }
        console.log(foundtenant.dues)
        if (amountpaid >= foundtenant.dues) {
            const extra = amountpaid - foundtenant.dues
            foundtenant.dues = 0
            foundtenant.duesdays = 0
            foundtenant.duesmonth = 0
            foundtenant.advanced = (foundtenant.advanced || 0) + extra;
            foundtenant.paymentstatus = "paid"
            foundtenant.startdues = null
            console.log("hii")
        }
        else {

            foundtenant.dues -= amountpaid
            const date = foundtenant.dues / onedaypayment
            foundtenant.advanced = 0;
            console.log(date)
            const month = Math.floor(date / 30);
            console.log(month)
            const days = Math.floor(date - month * 30);
            console.log(days)
            foundtenant.duesmonth = month;
            foundtenant.dues > 0 && foundtenant.dues < foundtenant.securitydeposit ? foundtenant.paymentstatus = "dues" : foundtenant.paymentstatus = "over-dues"

            if (days == 0 && foundtenant.dues > 0) {
                foundtenant.duesdays = 1;
            }
            else {

                foundtenant.duesdays = (days);


            }
        }

        foundtenant.lastPayment = Date.now();

        await foundtenant.save();
        console.log(foundtenant)
        const paymnet = await Payment.create({
            tenantId,
            branch,
            amountpaid,
            tilldateAdvance: foundtenant.advanced,
            tilldatedues: foundtenant.dues,
            tilldatestatus: foundtenant.paymentstatus
        })
        return res.status(200).json({
            success: true,
            message: "payment created successfull",
            paymnet: paymnet,
            foundtenant
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "internal server error"
        })
    }
}