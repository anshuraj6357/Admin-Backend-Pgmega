const express = require("express");
const router = express.Router();
const multer = require("multer")
const { Validate, IsOwner } = require("../middleware/uservalidate");
const upload = multer({ storage: multer.diskStorage({}) });


const {
    GetAllBranchOwner, AddBranch, EditBranch, getAllPg,
    AppliedFilters,AppliedAllFilters,DeleteRoom,
    UpdateRoom,AllRooms,GetRoomById,
    DeleteBranch, DeleteProperty, GetAllBranch,
    AddRoom, addhotelroom, getdetails,
    appointBranchManager, GetAllBranchByBranchId
} = require("../controller/property");

console.log("hii")


//  router.post("/create",Validate, CreateProperty);
router.get("/get", Validate, GetAllBranch)
router.get("/getroombyid/:Id", Validate, GetRoomById)
router.get("/getalllbranchowner", Validate, GetAllBranchOwner)
router.get("/allrooms", Validate, AllRooms)
router.delete("/deleteroom/:id", Validate, DeleteRoom)
router.put("/updateroom/:Id", Validate, UpdateRoom)
router.post("/appliedallfilter", Validate, AppliedAllFilters)
router.get("/filtered/:cityFromQuery", Validate, AppliedFilters)
router.post(
    "/addroom", Validate,
    upload.fields([{ name: "images", maxCount: 10 }]),  // multer first
    AddRoom                                               // then controller
);

router.get("/get/:id", getdetails)



router.post("/addhotelroom"
    , Validate,
    upload.fields([{ name: "images", maxCount: 10 }]),
    addhotelroom)
router.get("/getbranch/bybranchMnager", Validate, GetAllBranchByBranchId)
router.post("/add", Validate,upload.array("images"), AddBranch);
router.post("/createbranchmanager/:id", Validate, IsOwner, appointBranchManager)
router.patch("/edit/:branchId", Validate, EditBranch)
router.delete("/DeleteBranch", Validate, DeleteBranch)
router.delete("/DeleteProperty/:id", Validate, DeleteProperty)

router.get("/allpg", getAllPg)

module.exports = router;
