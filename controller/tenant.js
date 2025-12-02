

const Tenant = require("../model/tenants")
const Payment = require("../model/payment")
const PropertyBranch = require("../model/propertyBranch")
const Complaint = require("../model/complaints")


exports.AddTenants = async (req, res) => {
    console.log("req.user.id", req.user._id);

    try {
        const {
            contactNumber,
            name,
            Rent,
            dues,
            advanced,
            idProof,
            idProofType,
            emergencyContactNumber,
            documentsPhoto,
            roomNumber,
            branch
        } = req.body;

        if (!contactNumber || !name || !Rent || !roomNumber || !branch) {
            return res.status(400).json({ success: false, message: "Required fields missing" });
        }

        const FoundBranch = await PropertyBranch.findOne({ _id: branch });
        if (!FoundBranch) return res.status(400).json({ success: false, message: "Branch not found" });

        const roomNum = Number(roomNumber);
        const room = FoundBranch.rooms.find(r => Number(r.roomNumber) === roomNum);
        if (!room) return res.status(400).json({ success: false, message: "Room not found in this branch" });

        let capacity = room.type === "Double" ? 2 : room.type === "Triple" ? 3 : 1;
        const tenantsInRoom = await Tenant.countDocuments({ branch: branch,status:"Active", roomNumber: roomNum });

        if (tenantsInRoom >= capacity) {
            return res.status(400).json({ success: false, message: "Room already full" });
        }

        const NewTenant = new Tenant({
            branch,
            contactNumber,
            name,
            Rent,
            dues,
            advanced,
            idProof,
            idProofType,
            emergencyContactNumber,
            documentsPhoto,
            roomNumber: roomNum,
            branchmanager: req.user._id
        });

        await NewTenant.save();

        // Update room status only when it becomes full
        if (room.occupied + 1 >= capacity) {
            room.availabilityStatus = "Occupied";
            if (!FoundBranch.occupiedRoom.includes(roomNum)) {
                FoundBranch.occupiedRoom.push(roomNum);
            }
        }
        room.occupied += 1;

        await FoundBranch.save();

        return res.status(200).json({
            success: true,
            message: "Tenant added successfully",
            tenant: NewTenant,
            FoundBranch
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message
        });
    }
};

exports.MarkTenantInactive = async (req, res) => {
    try {
        const { id } = req.params;

        const foundedTenant = await Tenant.findById(id);
        if (!foundedTenant) {
            return res.status(400).json({ success: false, message: "Tenant not found" });
        }

        const branch = await PropertyBranch.findById(foundedTenant.branch);
        if (!branch) {
            return res.status(400).json({ success: false, message: "Branch not found" });
        }

        const roomNum = foundedTenant.roomNumber;
        const room = branch.rooms.find(r => r.roomNumber === roomNum);
        if (!room) {
            return res.status(400).json({ success: false, message: "Room not found" });
        }

        const capacity = room.type === "Double" ? 2 : room.type === "Triple" ? 3 : 1;

        // CASE 1: No dues → Direct checkout
        if (foundedTenant.dues <= 0) {
            foundedTenant.status = "In-Active";
            foundedTenant.checkedoutdate = new Date();

            // Decrement room occupancy safely
            room.occupied = Math.max(0, (room.occupied || 1) - 1);

            // Update room availability
            room.availabilityStatus = room.occupied >= capacity ? "Occupied" : "Available";

            // Remove room from occupiedRoom if no tenants
            if (room.occupied === 0) {
                branch.occupiedRoom = branch.occupiedRoom.filter(rn => rn !== roomNum);
            }

          
            await branch.save();
            await foundedTenant.save();

            return res.status(200).json({
                success: true,
                message: "Tenant set to Inactive successfully",
                branch,
                tenant: foundedTenant
            });
        }

        // CASE 2: Tenant has dues → verify payments
        const payments = await Payment.find({ tenantId: foundedTenant._id });
        if (payments.length === 0) {
            return res.status(400).json({ success: false, message: `Tenant has dues of ${foundedTenant.dues}` });
        }

        let totalPaid = foundedTenant.advanced;
        payments.forEach(p => totalPaid += p.amountpaid);

        const checkIn = new Date(foundedTenant.checkInDate);
        const checkOut = new Date();
        const years = checkOut.getFullYear() - checkIn.getFullYear();
        const months = checkOut.getMonth() - checkIn.getMonth();
        const totalMonths = years * 12 + months + 1;

        const totalShouldPay = totalMonths * foundedTenant.Rent;

        if (totalShouldPay - totalPaid !== 0) {
            return res.status(400).json({ success: false, message: "Please clear all dues before checkout" });
        }

        // CHECKOUT PROCESS
        foundedTenant.status = "In-Active";
        foundedTenant.checkedoutdate = checkOut;

        // Decrement room occupancy safely
        room.occupied = Math.max(0, (room.occupied || 1) - 1);

        // Update room availability
        room.availabilityStatus = room.occupied >= capacity ? "Occupied" : "Available";

        // Remove room from occupiedRoom if empty
        if (room.occupied === 0) {
            branch.occupiedRoom = branch.occupiedRoom.filter(rn => rn !== roomNum);
        }

        // Recalculate totalBeds
        branch.totalBeds = branch.rooms.reduce((acc, r) => acc + (r.capacity - (r.occupied || 0)), 0);

        await branch.save();
        await foundedTenant.save();

        return res.status(200).json({
            success: true,
            message: "Tenant set to Inactive successfully",
            branch,
            tenant: foundedTenant
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

exports.AddRentTenants = async (req, res) => {

    try {
        const { tenantId } = req.params
        const { amountpaid } = req.body;

        const foundtenant = await Tenant.findById(tenantId)

        if (!foundtenant) {
            return res.status(400).json({
                success: false,
                message: "Not Able To Found The Tenant"
            })
        }

        if (amountpaid < 0 || !amountpaid) {
            return res.status(400).json({
                success: false,
                message: "Inavlid Payment Amount"
            })
        }

        const newPayment = new Payment({
            tenantId: tenantId,
            amountpaid: amountpaid,
            branch: foundtenant.branch
        })

        await newPayment.save();

        foundtenant.dues = Math.max(0, foundtenant.dues - amountpaid);

        await foundtenant.save();

        return res.status(200).json({
            success: true,
            message: "payment paid successfully",
            payment: foundtenant
        })

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message,
        });
    }
};

exports.GetTenantByid = async (req, res) => {
    try {
        const { id } = req.params
        const foundTenant = await Tenant.findById(id)
            .populate({
                path: 'branch', // populate the branch field in Tenant
                populate: {
                    path: 'property', // then populate the property field inside that branch
                }
            });


        if (!foundTenant) {
            return res.status(400).json({
                success: true,
                messaeg: "not Founded The tenant"
            })
        }
        const allcomplain = await Complaint.find({ tenantId: id });
        const allpayment = await Payment.find({ tenantId: id })

        return res.status(200).json({
            success: true,
            mesage: "Founded all the tenantDetails",
            foundTenant,
            allcomplain,
            allpayment
        })


    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message,
        });
    }
};
exports.GetTenantsByBranch = async (req, res) => {
    try {
        const id = req.user._id;
        console.log(id)

        const propert = await PropertyBranch.find({ branchmanager: id })
        if (propert.length <= 0) {
            console.log("not")
            return res.status(400).json({
                succes: true,
                message: "Not have any property"
            })
        }
        let alltenant = [];
        for (const branch of propert) {
            const findAllTenant = await Tenant.find({ branch: branch._id })
            if (findAllTenant.length > 0) {
                alltenant.push(...findAllTenant)
            }
        }
        console.log(alltenant)




        return res.status(200).json({
            success: true,
            message: "All tenats Are",
            findAllTenant: alltenant
        })

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message,
        });
    }
};
exports.GetTenantsByBranchId = async (req, res) => {
    try {
        const { id } = req.params
        console.log(id)

        const alltenants = await Tenant.find({ branch: id })
        return res.status(200).json({
            success: true,
            message: "All tenats Are",
            findAllTenant: alltenants
        })

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message,
        });
    }
};
exports.calculatePending = async (req, res) => {

    try {
        const { id } = req.params;

        const foundtenant = await Tenant.findById(id);

        if (!foundtenant) {
            return res.status(400).json({
                success: true,
                message: "not founded the tenant"
            })
        }

        let dues = foundtenant.dues;
        return res.status(200).json({
            success: true,
            message: "dues details",
            dues
        })

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message,
        });
    }
};

exports.UpdateTenant = async (req, res) => {
    console.log("updating---")
    try {
        const { id } = req.params;
        const updates = req.body;

        const foundTenant = await Tenant.findById(id);
        console.log(foundTenant)
        if (!foundTenant) {
            return res.status(404).json({
                success: false,
                message: "Tenant not found",
            });
        }


        Object.keys(updates).forEach((key) => {
            foundTenant[key] = updates[key];
        });

        await foundTenant.save();
        console.log("updated..")
        console.log(foundTenant)


        return res.status(200).json({
            success: true,
            message: "Tenant updated successfully",
            foundTenant,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};


exports.GetTenantRentHistory = async (req, res) => {

    try {
        const { tenantid } = req.params

        const foundedtenant = await Tenant.find(tenantid)
            .sort({ date: 1 })
            .populate({
                path: tenantid,
                select: "dues"
            })
            ;

        if (!foundedtenant) {
            return res.status(400).json({
                success: false,
                mesage: "Not Able to Finf The Tenant"
            })
        }
        return res.status.json({
            success: true,
            message: "founded the history",
            foundedTenant: foundedtenant
        })

    } catch (error) {

    }
}


exports.getAllStatusTenantByBranch = async (req, res) => {

    try {
        const { branchId } = req.params
        const { status } = req.body
        console.log(branchId)

        const alluser = await Tenant.find({
            branch: branchId,
            status: status
        });
        console.log(alluser)

        if (alluser.length == 0) {
            return res.status(400).json({
                success: false,
                mesage: "Got NOT All the Active Users"
            })
        }
        let alldetails = []
        for (let i = 0; i < alluser.length; i++) {
            if (alluser[i].status == "Active") {
                const payload = {
                    name: alluser[i].name,
                    contact: alluser[i].Contact,
                    rent: alluser[i].Rent,
                    checkInDate: alluser[i].checkInDate,
                };
                alldetails.push(payload)
            }
        }
        return res.status(200).json({
            success: true,
            message: "All Active Users Are given",
            activeuser: alldetails
        })

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message,
        });
    }
};
exports.getAlltenantbyStatus = async (req, res) => {

    try {
        const id = req.user._id
        const { status } = req.params
        const property = await PropertyBranch.find({ branchmanager: id })
        if (property.length <= 0) {
            return res.status(400).json({
                success: true,
                message: "Not uploaded any branch"
            })
        }
        let alldetail = []
        for (const branch of property) {
            let alluser;
            if (status == "all") {
                alluser = await Tenant.find({
                    branch: branch._id,
                });
            }
            else {
                alluser = await Tenant.find({
                    branch: branch._id,
                    status: status
                });
            }

            alldetail.push(...alluser)
        }

        console.log(alldetail)

        return res.status(200).json({
            success: true,
            message: "All Active Users Are given",
            statususer: alldetail
        })

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message,
        });
    }
};



exports.getAllActiveTenant = async (req, res) => {

    try {
        const id = req.params.id

        const alltenant = await Tenant.find({ branch: id })
        console.log(alltenant)
        if (alltenant.length <= 0) {
            return res.status(400).json({
                success: true,
                message: "Not uploaded any branch"
            })
        }

        let tenant = []

        for (const t of alltenant) {
            if (t.status !== "In-Active") {
                tenant.push(t)
            }
        }

        console.log(tenant)

        return res.status(200).json({
            success: true,
            message: "All Active Users Are given",
            findAllTenant: tenant
        })

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message,
        });
    }
};


