const express = require("express");
const router = express.Router();
const {Validate} = require("../middleware/uservalidate");

const {
    AddTenants,MarkTenantInactive,AddRentTenants,
    GetTenantByid,GetTenantsByBranch,calculatePending,UpdateTenant,getAllActiveTenant,
    GetTenantRentHistory,getAllActiveTenantByBranch,GetTenantsByBranchId,getAlltenantbyStatus
} = require("../controller/tenant");

console.log("hiidc")

router.post("/create",Validate, AddTenants);
 router.get("/calculatePending/:id", calculatePending);
 router.put("/update/:id", UpdateTenant);
// router.post("/renthistory/:tenantid", GetTenantRentHistory);
//  router.get("/allactive/:branchId", getAllActiveTenantByBranch);
  router.get("/allstatus/:status",Validate, getAlltenantbyStatus);
    router.get("/activetenant/:id",Validate, getAllActiveTenant);
 router.post("/markinctive/:id",MarkTenantInactive)
 router.post("/AddRentTenants/:tenantId",Validate,AddRentTenants)
 router.get("/GetTenantByid/:id", GetTenantByid)
 router.get("/GetTenantsByBranch",Validate, GetTenantsByBranch)
  router.get("/GetTenantsByBranchid/:id",Validate, GetTenantsByBranchId)



module.exports = router;