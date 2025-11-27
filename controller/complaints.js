




const Complaint = require("../model/complaints");

const PropertyBranch = require("../model/propertyBranch");


exports.GetAllComplain = async (req, res) => {
  console.log("hii")

  try {
    const id = req.user._id
    console.log(id)
    const allbranch = await PropertyBranch.find({ branchmanager: id });

    if (allbranch.length <= 0) {
      console.log("1")
      return res.status(400).json({
        success: false,
        message: "Not Have ANy Branch"
      })
    }
    let allcomplain = [];
    let pend = 0;
    let inp = 0;
    let Res = 0

    for (let i = 0; i < allbranch.length; i++) {
      const test = await Complaint.findOne().populate("tenantId").populate("assignedTo");
      console.log("test", test);



      let complaints = await Complaint.find({ branchId: allbranch[i]._id }).populate("tenantId").populate({
        path: "branchId",
        populate: {
          path: "property"
        }
      });

      for (let y = 0; y < complaints.length; y++) {
        console.log(complaints[y].status)
        if (complaints[y].status == "Pending") {
          pend++;
        }
        else if (complaints[y].status == "In-Progress") {
          inp++;
        }
        else {
          Res++
        }
      }
      if (complaints.length > 0) {
        allcomplain.push(complaints)
      }



    }
    console.log(allcomplain)

    return res.status(200).json({
      success: true,
      data: allcomplain,
      pending: pend,
      InProgress: inp,
      Resolved: Res
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};


exports.CreateComplain = async (req, res) => {
  try {
    const tenantId = req.user._id;
    const { title, description, category, branchId } = req.body;
    const complaint = await Complaint.create({ title, description, category, branchId, tenantId });
    res.status(201).json({ success: true, message: "Complaint registered successfully", data: complaint });
  } catch (error) {
    res.status(400).json({ success: false, message: "Failed to create complaint", error: error.message });
  }
};


exports.GetAllComplainOFBranch = async (req, res) => {
  try {
    const { branchId } = req.params;
    console.log("branchId",branchId)
    const complaints = await Complaint.find({ branchId }).populate("tenantId").populate("assignedTo");
    res.status(200).json({ success: true, count: complaints.length, data: complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};


exports.changeStatusofComplain = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { status } = req.body;
    const updatedComplaint = await Complaint.findByIdAndUpdate(
      complaintId,
      { status, updatedAt: Date.now() },
      { new: true }
    );
    if (!updatedComplaint) return res.status(404).json({ success: false, message: "Complaint not found" });
    res.status(200).json({ success: true, message: "Status updated", data: updatedComplaint });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};


exports.assignComplaint = async (req, res) => {
  try {
    console.log(req.body)

    const { assignedTo, complaintId } = req.body;

    const complaint = await Complaint.findByIdAndUpdate(
      complaintId,
      { assignedTo: assignedTo, status: "In-Progress" },
      { new: true }
    );
    if (!complaint) return res.status(404).json({ success: false, message: "Complaint not found" });
    console.log(complaint)
    res.status(200).json({ success: true, message: "Complaint assigned successfully", data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};


exports.getTenantComplaints = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const complaints = await Complaint.find({ tenantId }).populate("branchId").populate("assignedTo");
    res.status(200).json({ success: true, count: complaints.length, data: complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};


exports.getComplaintsByStatus = async (req, res) => {
  try {
    const id = req.user._id
    const { status } = req.params;
    console.log("dec", status)
    const allbranch = await PropertyBranch.find({ branchmanager: id })
    if (allbranch.length <= 0) {
      return res.status(400).json({
        sucess: true,
        messsage: "not founded andy branch"
      })
    }
    let statuscomplain = [];
    for (const branch of allbranch) {
      const complaints = await Complaint.find({ branchId: branch._id }).populate("tenantId").populate("branchId");
      console.log(complaints)
      if (status === "all") {

        if (complaints.length > 0) {
          console.log(complaints)
          statuscomplain.push(...complaints);

        }

      }
      else {
        for (const comp of complaints) {
          console.log(comp)

          if (comp.status == status) {
            statuscomplain.push(comp)
          }
        }

      }


    }

    res.status(200).json({ success: true, data: statuscomplain });
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};


exports.getComplaintsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const complaints = await Complaint.find({ category }).populate("tenantId").populate("branchId");
    res.status(200).json({ success: true, count: complaints.length, data: complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};


exports.updateComplaintDetails = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const updatedComplaint = await Complaint.findByIdAndUpdate(complaintId, req.body, { new: true });
    if (!updatedComplaint) return res.status(404).json({ success: false, message: "Complaint not found" });
    res.status(200).json({ success: true, message: "Complaint updated successfully", data: updatedComplaint });
  } catch (error) {
    res.status(400).json({ success: false, message: "Failed to update complaint", error: error.message });
  }
};


exports.deleteComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const complaint = await Complaint.findByIdAndDelete(complaintId);
    if (!complaint) return res.status(404).json({ success: false, message: "Complaint not found" });
    res.status(200).json({ success: true, message: "Complaint deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};
