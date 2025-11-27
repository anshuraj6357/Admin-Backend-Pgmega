const express = require("express");
const router = express.Router();
const { Validate } = require("../middleware/uservalidate");

const complaintController = require("../controller/complaints");
console.log("fhgvbdjz")
router.get("/complain",Validate, complaintController.GetAllComplain);
router.post("/complain/create",Validate, complaintController.CreateComplain);
router.get("/complain/branch/:branchId", complaintController.GetAllComplainOFBranch);
router.patch("/complain/status/:complaintId", complaintController.changeStatusofComplain);
router.put("/complain/assign", complaintController.assignComplaint);
router.get("/complain/tenant/:tenantId", complaintController.getTenantComplaints);
router.get("/complain/status/:status",Validate, complaintController.getComplaintsByStatus);
router.get("/complain/category/:category", complaintController.getComplaintsByCategory);
router.put("/complain/:complaintId", complaintController.updateComplaintDetails);
router.delete("/complain/:complaintId", complaintController.deleteComplaint);

module.exports = router;
