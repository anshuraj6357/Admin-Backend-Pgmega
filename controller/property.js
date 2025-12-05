
const Property = require("../model/property")

const PropertyBranch = require("../model/propertyBranch")
const Signup = require("../model/user")
const branchmanager = require("../model/branchmanager")
const bcrypt = require("bcrypt")
const Uploadmedia = require("../utils/cloudinary.js")
const deletemedia = require("../utils/cloudinary.js")
const axios = require('axios')

async function AllProperty(id) {
    const Allproprty = await Property.find({ owner: id }).populate({
        path: "owner",
        select: "username email "
    });
    return Allproprty;
}
async function founderror(error) {

}


exports.CreateProperty = async (req, res) => {
    console.log(req.user)

    try {

        const userId = req.user._id;
        const { name } = req.body;


        if (!name) {
            return res.status(400).json({
                success: false,
                message: "please Filled  the name  And Upload"
            })
        }

        const allproperty = AllProperty(userId);
        if (allproperty.length > 0) {
            return res.status(400).json({
                success: false,
                message: "User have the property Listed"
            })
        }
        const newProperty = await Property.create({
            name,
            owner: userId
        })
        return res.status(200).json({
            success: "true",
            message: "property created Successfully",
            newProperty
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: "Internal server Error"
        })

    }
}

exports.AddBranch = async (req, res) => {
    console.log(req.body);

    try {
        const userId = req.user._id;
        const imageFiles = req.files || [];
        const uploadimages = [];

        const foundproperty = await Signup.findById(userId);
        if (!foundproperty) {
            return res.status(400).json({
                success: false,
                message: "Property not found",
            });
        }

        const {
            address,
            city,
            state,
            pincode,
            name,
            streetAdress,
            landmark,
        } = req.body;

        if (!address || !city || !state || !pincode || !streetAdress || !landmark || !name) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
        }

        // ----------------------------
        // Upload Images
        // ----------------------------
        for (let file of imageFiles) {
            const uploadRes = await Uploadmedia.Uploadmedia(file.path);
            uploadimages.push(uploadRes.secure_url);
        }

        // ----------------------------
        // Combine full address to geocode
        // ----------------------------
        const fullAddress = `${streetAdress}, ${landmark}, ${address}, ${city}, ${state}, ${pincode}`;

        console.log("FULL ADDRESS:", fullAddress);

        // ----------------------------
        // Fetch Coordinates using Google API
        // ----------------------------
        const geo = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json`,
            {
                params: {
                    address: fullAddress,
                    key: "AIzaSyBI_1GjWzjhnK--jH94wVq3dmdOGm6sUos",
                },
            }
        );

        const geoData = geo.data;

        let lat = null;
        let lng = null;

        if (geoData.status === "OK" && geoData.results.length > 0) {
            lat = geoData.results[0].geometry.location.lat;
            lng = geoData.results[0].geometry.location.lng;
        } else {
            return res.status(400).json({
                success: false,
                message: "Unable to fetch latitude and longitude for given address",
                google_response: geoData.status,
            });
        }

        console.log("Coordinates:", lat, lng);

        // ----------------------------
        // Create branch in database
        // ----------------------------
        const CreatedBranch = await PropertyBranch.create({
            city,
            name,
            address,
            state,
            pincode,
            streetAdress,
            landmark,

            owner: req.user._id,
            property: foundproperty._id,

            Propertyphoto: uploadimages,

            // GeoJSON location
            location: {
                type: "Point",
                coordinates: [lng, lat], // IMPORTANT: MongoDB format is [long, lat]
            },

            lat: lat,
            long: lng,
        });

        return res.status(200).json({
            success: true,
            message: "Branch created successfully",
            CreatedBranch,
        });

    } catch (error) {
        console.log("ERROR in AddBranch:", error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message,
        });
    }
};



exports.GetAllBranch = async (req, res) => {

    try {
        console.log("getting all branch ")

        const userId = req.user._id;

        const allbranch = await PropertyBranch.find({ branchmanager: userId }).populate('branchmanager');
        if (allbranch.length <= 0) {
            return res.status(200).json({
                success: false,
                message: "Not have any branch"
            })
        }

        return res.status(200).json({

            success: true,
            message: "All branch are",
            allbranch
        })

    } catch (error) {
        console.log(error)
        return res.status(400).json({
            success: false,
            message: "internal server error"
        })

    }
}

// Example API endpoint
exports.getAllBranchesWithLocation = async (req, res) => {
    try {
        const { branchId } = req.params;

        const branch = await PropertyBranch.findById(branchId)
            .populate("rooms") // if rooms are separate model (optional)
            .lean();

        if (!branch) {
            return res.status(404).json({
                success: false,
                message: "Branch not found",
            });
        }

        // Extract main branch location
        const branchLocation = branch.location && branch.location.coordinates
            ? { lat: branch.location.coordinates[1], lng: branch.location.coordinates[0] }
            : (branch.lat && branch.long ? { lat: branch.lat, lng: branch.long } : null);

        return res.json({
            success: true,
            branch: {
                _id: branch._id,
                name: branch.name,
                address: branch.address,
                city: branch.city,
                state: branch.state,
                pincode: branch.pincode,
                location: branchLocation,
                rooms: branch.rooms, // All rooms of this branch
            }
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};







exports.GetAllBranchOwner = async (req, res) => {

    try {
        console.log("getting all branch ")

        const userId = req.user._id;

        const allbranch = await PropertyBranch.find({ owner: userId }).populate('branchmanager');
        if (allbranch.length <= 0) {
            return res.status(200).json({
                success: false,
                message: "Not have any branch"
            })
        }

        return res.status(200).json({

            success: true,
            message: "All branch are",
            allbranch
        })

    } catch (error) {
        console.log(error)
        return res.status(400).json({
            success: false,
            message: "internal server error"
        })

    }
}
exports.GetAllBranchByBranchId = async (req, res) => {

    try {
        console.log(" hey this side is anshu ")
        const userId = req.user._id;
        console.log("userId", userId)
        const a = await branchmanager.findById(userId)
        const allbranch = await PropertyBranch.find({ branchmanager: userId }).populate('branchmanager');
        if (allbranch.length == 0) {
            return res.status(200).json({
                success: true,
                message: "Not have any branch"
            })
        }
        console.log("a")
        return res.status(200).json({

            success: true,
            message: "All branch are",
            allbranch,
            branch: a
        })

    } catch (error) {
        console.log(error)
        return res.status(400).json({
            success: false,
            message: "internal server error"
        })

    }
}



exports.changebranchpassword = async (req, res) => {

    try {
        const { id, password, confirmPassword } = req.body;
        console.log("fcd", req.body)


        const branchmanagers = await branchmanager.findById(id)
        if (password != confirmPassword) {
            return res.status(400).json({
                succes: false,
                message: "password and conferm password not match"
            })
        }
        if (password.length < 6 || password.lengt > 10) {
            return res.status(400).json({
                succes: false,
                message: "password and conferm password not match"
            })
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const branchser = await Signup.findById(id)
        branchmanagers.pwdchanged = true,
            await branchmanagers.save()
        branchser.password = hashedPassword;
        await branchser.save()



        return res.status(200).json({
            success: true,
            message: "Branch manager password pdated successfully",
        });


    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};



exports.EditBranch = async (req, res) => {

    try {
        const userId = req.user._id;
        const { branchId } = req.params;
        const foundBranch = await PropertyBranch.findById(branchId).populate('owner');
        if (!foundBranch) {
            return res.status(400).json({
                success: false,
                message: 'Not Founded the Branch'
            })
        }
        console.log(foundBranch)


        const payload = {};


        if (req.body.address) payload.address = req.body.address;
        if (req.body.city) payload.city = req.body.city;
        if (req.body.state) payload.state = req.body.state;
        if (req.body.pincode) payload.pincode = req.body.pincode;
        if (req.body.status) payload.status = req.body.status;
        // payload.owner = foundBranch.owner._id;
        // payload.property = foundBranch.property;
        const updatedbranch = await PropertyBranch.findByIdAndUpdate(branchId, payload, { new: true })
        console.log(updatedbranch)

        return res.status(200).json({
            success: true,
            message: 'Branch updated successfully',
            branch: updatedbranch
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            mesage: "error"
        })
    }
}
exports.DeleteBranch = async (req, res) => {
    try {
        const userId = req.user._id;
        const branchId = req.body;
        const FoundBranch = await PropertyBranch.findById(branchId).populate({ path: 'owner' });

        if (!FoundBranch) {
            return res.status(400).json({
                success: false,
                message: 'Not Founded the Branch'
            })
        }


        if (userId != FoundBranch.owner.id) {
            return res.status(400).json({
                success: false,
                mesage: "You are not the owner"
            })
        }
        if (FoundBranch.occupiedRoom.length > 0) {
            return res.status(400).json({
                success: false,
                mesage: "Someone is occupied the room "
            })
        }

        PropertyBranch.deleteById(FoundBranch._id)
        return res.status(200).json({
            success: true,
            message: "Delete the branch successfully"
        })




    } catch (error) {
        return founderror(error)
    }
}
exports.DeleteProperty = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if branch manager exists
        const foundBranchManager = await branchmanager.findOne({ propertyId: id });

        if (foundBranchManager) {
            foundBranchManager.status = "In-Active";
            await foundBranchManager.save();
        }

        // Delete property
        const deletedProperty = await PropertyBranch.findByIdAndDelete(id);

        if (!deletedProperty) {
            return res.status(404).json({
                success: false,
                message: "Property not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Property deleted successfully",
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

exports.appointBranchManager = async (req, res) => {
    try {
        console.log("req.body", req.body);
        const userId = req.user._id;
        const branchId = req.params.id;
        const { name, email, phone } = req.body;

        if (!name || !email || !phone) {
            return res.status(400).json({
                success: false,
                message: "Please fill all the fields",
            });
        }

        const foundBranch = await PropertyBranch.findById(branchId);
        if (!foundBranch) {
            return res.status(400).json({
                success: false,
                message: "Branch not found",
            });
        }

        // Step 1️⃣: create user first (Signup)
        const password = "1234";
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await Signup.create({
            email,
            role: "branch-manager",
            username: name,
            password: hashedPassword,
        });

        // Step 2️⃣: create branch manager using the SAME ID as Signup
        const manager = await branchmanager.create({
            _id: user._id, // 👈 same id for both
            propertyId: userId, // this is the admin/owner id who created it
            name,
            email,
            phone,
        });

        // Step 3️⃣: attach the manager to the branch
        foundBranch.branchmanager = manager._id;
        await foundBranch.save();

        return res.status(200).json({
            success: true,
            message: "Branch manager created successfully",
            branchmanager: manager,
            foundBranch,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};
exports.AddRoom = async (req, res) => {
    try {
        console.log("Adding Room...");
        console.log("BODY => ", req.body);
        console.log("FILES => ", req.files);

        const imageFiles = req.files?.images;

        // Role check
        if (req.user.role !== "branch-manager") {
            return res.status(403).json({
                success: false,
                message: "You are not authorised to add a room",
            });
        }

        // Extract fields from req.body






        const {
            branch,
            roomNumber,
            type,
            price,
            facilities,
            description,
            notAllowed,
            rules,
            furnishedType,
            allowedFor,
            availabilityStatus,
            rentperday,
            rentperhour,
            rentperNight,
            category,
            city,
            renttype,
            flattype
        } = req.body;

        // Required fields validation
        if (!branch || !roomNumber || !category) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required fields",
            });
        }

        // Validate price based on category
        if ((category !== "Hotel") && !price) {
            return res.status(400).json({
                success: false,
                message: "Price is required for PG or Rented-Room",
            });
        }
        if (category === "Hotel" && !rentperday && !rentperhour && !rentperNight) {
            return res.status(400).json({
                success: false,
                message: "At least one rent (per day/hour/night) is required for Hotel",
            });
        }

        // Find branch
        const foundBranch = await PropertyBranch.findById(branch);
        if (!foundBranch) {
            return res.status(404).json({
                success: false,
                message: "Branch not found",
            });
        }

        // Check duplicate room number
        const roomExists = foundBranch.rooms.some(
            (room) => room.roomNumber == roomNumber
        );
        if (roomExists) {
            return res.status(400).json({
                success: false,
                message: "Room Number Already Exists",
            });
        }

        // Bed count based on type


        // Upload images
        const uploadedImages = [];
        if (imageFiles && imageFiles.length > 0) {
            for (let file of imageFiles) {
                const uploadRes = await Uploadmedia.Uploadmedia(file.path);
                uploadedImages.push(uploadRes.secure_url);
            }
        }

        // Normalize arrays
        const facilitiesArr = Array.isArray(facilities) ? facilities : (facilities ? [facilities] : []);
        const notAllowedArr = Array.isArray(notAllowed) ? notAllowed : (notAllowed ? [notAllowed] : []);
        const rulesArr = Array.isArray(rules) ? rules : (rules ? [rules] : []);

        // Create room object according to schema



        const newRoom = {
            roomNumber,
            allowedFor,
            renttype: category === "Rented-Room" ? renttype : undefined,
            flattype: renttype === "Flat-Rent" ? flattype : undefined,
            roomtype: renttype === "Room-Rent" ? roomtype : undefined,
            hoteltype: category === "Hotel" ? hoteltype : undefined,
            type:category==="Pg"?type:undefined,
            price: category !== "Hotel" ? price : undefined,
            rentperday: category === "Hotel" ? rentperday : undefined,
            rentperhour: category === "Hotel" ? rentperhour : undefined,
            rentperNight: category === "Hotel" ? rentperNight : undefined,
            facilities: facilitiesArr,
            description: description || "",
            notAllowed: notAllowedArr,
            rules: rulesArr,
            furnishedType: furnishedType || "Semi Furnished",
          
            availabilityStatus: availabilityStatus || "Available",
            category,
            city: city || foundBranch.city,
            createdBy: req.user._id,
            branch: foundBranch._id,
            roomImages: uploadedImages,
        };

        // Save inside branch.rooms array
        foundBranch.rooms.push(newRoom);


        await foundBranch.save();

        return res.status(200).json({
            success: true,
            message: "Room added successfully",
            ROOM: newRoom,
        });

    } catch (error) {
        console.error("Error Adding Room :", error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message,
        });
    }
};



exports.AllRooms = async (req, res) => {
    try {
        console.log("Fetching all the room ")
        const proprtybranch = await PropertyBranch.find({ branchmanager: req.user._id });
        if (proprtybranch.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No Branches Are Found"
            })
        }
        const allrooms = [];
        for (const branch of proprtybranch) {

            allrooms.push(...branch.rooms)

        }
        return res.status(200).json({
            success: true,
            totalRooms: allrooms.length,
            rooms: allrooms
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })

    }
}

exports.AppliedAllFilters = async (req, res) => {
    try {
        console.log("Received Filters:", req.body);

        const {
            city,
            min = 0,
            max = 999999,
            category = "any",
            type = "any",
            facilities = amenities = [],
        } = req.body;

        // Fetch only rooms, not whole branches
        const branches = await PropertyBranch.find({}, "rooms");

        let rooms = [];

        // Collect all rooms
        branches.forEach(branch => {
            branch.rooms.forEach(room => {
                rooms.push(room);
            });
        });


        // ---------------------------
        // 🔥 APPLY FILTERS
        // ---------------------------

        // City filter (regex match)
        if (city && city.trim() !== "") {
            const cityRegex = new RegExp(city.slice(0, 4), "i"); // match first 4 letters
            rooms = rooms.filter(r => r.city && cityRegex.test(r.city));
        }

        console.log("1", rooms)

        // Price filter
        rooms = rooms.filter(r => r.price >= min && r.price <= max);
        console.log("1", rooms)

        // Category filter
        if (category !== "any") {
            rooms = rooms.filter(r => r.category?.toLowerCase() === category.toLowerCase());
        }
        console.log("1", rooms)

        // Type filter (only for PG)
        if (category === "pg" && type !== "any") {
            rooms = rooms.filter(r => r.type?.toLowerCase() === type.toLowerCase());
        }

        else if (category === "room" && type !== "any") {
            rooms = rooms.filter(r => r.type?.toLowerCase() === type.toLowerCase());
        }
        console.log("1", rooms)

        // Amenities filter
        if (facilities.length > 0) {
            rooms = rooms.filter(r =>
                r.facilities &&
                facilities.every(a => r.facilities.includes(a))
            );
        }
        console.log("1", rooms)



        console.log("filtered Room updated", rooms)

        return res.status(200).json({
            success: true,
            count: rooms.length,
            data: rooms
        });

    } catch (error) {
        console.error("Filter Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};





exports.AppliedFilters = async (req, res) => {
    try {
        console.log("city", req.params);

        const { cityFromQuery } = req.params;

        if (!cityFromQuery) {
            return res.status(400).json({
                success: false,
                message: "City is required"
            });
        }

        // Create regex from user query (case-insensitive)
        const cityRegex = new RegExp(`^${cityFromQuery.slice(0, 5)}`, "i");

        // Fetch branches with rooms
        const allBranches = await PropertyBranch.find({}, "rooms");

        if (!allBranches.length) {
            return res.status(400).json({
                success: false,
                message: "No Rooms Are Available"
            });
        }

        const availableRooms = [];

        allBranches.forEach(branch => {
            branch.rooms.forEach(room => {

                console.log("checking room city:", room.city);

                // REGEX MATCH
                if (room.city && cityRegex.test(room.city)) {
                    availableRooms.push(room);
                }
            });
        });

        return res.status(200).json({
            success: true,
            data: availableRooms
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};
exports.getdetails = async (req, res) => {
    try {
        console.log(req.body)


        const { id } = req.params;

        const foundBranch = await PropertyBranch.findOne({ "rooms._id": id })
            .populate({
                path: "rooms.branch",
                model: "PropertyBranch",
                select: "-rooms -__v -createdAt -updatedAt"
            })
            .exec();
        if (!foundBranch) {
            return res.status(400).json({
                succes: false,
                message: "not found the branch "
            })
        }

        console.log(foundBranch)




        const room = foundBranch.rooms.id(id);

        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }





        return res.status(200).json({
            success: true,
            message: "Room Updated Successfully",
            room
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};






exports.DeleteRoom = async (req, res) => {
    try {
        const { id } = req.params;

        // 1️⃣ Find the branch containing the specific room
        const foundBranch = await PropertyBranch.findOne({ "rooms._id": id });
        if (!foundBranch) {
            return res.status(400).json({
                success: false,
                message: "Branch not found for this room"
            });
        }

        // 2️⃣ Get the exact room object that we are deleting
        const room = foundBranch.rooms.id(id);
        if (!room) {
            return res.status(400).json({
                success: false,
                message: "Room not found"
            });
        }


        foundBranch.totalBeds = Math.max(0, foundBranch.totalBeds);

        // 4️⃣ Remove the room
        room.deleteOne();


        if (room.verified) {
            if (room.type === "Single") {
                foundBranch.totalBeds -= 1;
            } else if (room.type === "Double") {
                foundBranch.totalBeds -= 2;
            } else if (room.type === "Triple") {
                foundBranch.totalBeds -= 3;
            }
        }



        // 5️⃣ Save updated branch
        await foundBranch.save();

        return res.status(200).json({
            success: true,
            message: "Room Deleted Successfully"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

exports.UpdateRoom = async (req, res) => {
    try {
        const { Id } = req.params;
        console.log(req.body)
        const { roomNumber, type, price, facilities, rentperday, rentperhour, rentperNight } = req.body;


        const foundBranch = await PropertyBranch.findOne({ "rooms._id": Id })
        if (!foundBranch) {
            return res.status(400).json({
                succes: false,
                message: "not found the branch "
            })
        }




        const room = foundBranch.rooms.id(Id);

        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }


        if (roomNumber) room.roomNumber = roomNumber;
        if (type) room.type = type;
        if (price) room.price = price;
        if (facilities) room.facilities = facilities;
        if (rentperday) room.rentperday = rentperday;
        if (rentperhour) room.rentperhour = rentperhour;
        if (rentperNight) room.rentperNight = rentperNight;

        await foundBranch.save();



        return res.status(200).json({
            success: true,
            message: "Room Updated Successfully"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};
exports.getAllPg = async (req, res) => {
    try {
        const branches = await PropertyBranch.find({}, null, { strictPopulate: false })
            .populate({
                path: "rooms.branch", // populate branch inside each room if needed
                model: "PropertyBranch",
                select: "-rooms -__v -createdAt -updatedAt" // exclude heavy fields
            })
            .exec();

        // Filter only published & verified rooms
        const allrooms = branches.flatMap(branch =>
            branch.rooms.filter(room => room.toPublish?.status === true && room.verified === true)
        );

        return res.status(200).json({
            success: true,
            message: "Got all PG successfully",
            allrooms,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

exports.deleteimage = async (req, res) => {
    try {
        console.log(req.body);

        const { id, imageurl } = req.body;

        if (!id || !imageurl) {
            return res.status(400).json({
                success: false,
                message: "Please select image",
            });
        }

        // Find the branch that contains the room
        const foundroom = await PropertyBranch.findOne({ "rooms._id": id });
        if (!foundroom) {
            return res.status(400).json({
                success: false,
                message: "Room not found",
            });
        }

        // Find the specific room
        const room = foundroom.rooms.id(id);
        if (!room) {
            return res.status(400).json({
                success: false,
                message: "Room not found inside branch",
            });
        }

        // Delete image from cloud
        const respons = await deletemedia.deletemedia(imageurl);
        if (!respons) {
            return res.status(400).json({
                success: false,
                message: "Not able to delete the photo",
            });
        }

        // Remove from DB array
        room.roomImages.pull(imageurl);

        await foundroom.save();

        return res.status(200).json({
            success: true,
            message: "Room image deleted successfully",
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};
exports.addRoomImages = async (req, res) => {
    try {
        console.log(req.body)
        const { id } = req.body;
        console.log(req.files)

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No images selected",
            });
        }

        // Find the branch that contains the room
        const foundRoomBranch = await PropertyBranch.findOne({ "rooms._id": id });
        if (!foundRoomBranch) {
            return res.status(404).json({
                success: false,
                message: "Room not found",
            });
        }

        const room = foundRoomBranch.rooms.id(id);
        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Room not found inside branch",
            });
        }

        // Upload each image to Cloudinary
        const uploadedUrls = [];
        for (let file of req.files) {
            const uploadResp = await Uploadmedia.Uploadmedia(file.path || file.buffer, {
                folder: "room_images",
            });
            uploadedUrls.push(uploadResp.secure_url);
        }

        // Add uploaded URLs to roomImages array
        room.roomImages.push(...uploadedUrls);

        await foundRoomBranch.save();

        return res.status(200).json({
            success: true,
            message: "Images added successfully",
            roomImages: room.roomImages,
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message,
        });
    }
};

exports.getAllBranchManager = async (req, res) => {
    try {
        const id = req.user._id
        const branches = await PropertyBranch.find().populate("owner");
        let p = [];

        for (const a of branches) {
            if (branches.owner._id === id) {
                p.push(...branches.owner);
            }
        }


        return res.status(200).json({
            success: true,
            message: "Fetched all branch manager",
            p
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};





exports.getalllistedandunlisted = async (req, res) => {
    try {
        const branches = await PropertyBranch.find({}, null, { strictPopulate: false })
            .populate({
                path: "rooms.branch",
                model: "PropertyBranch",
                select: "-rooms -__v -createdAt -updatedAt"
            })
            .exec();

        // Fetch listed rooms
        const listedRooms = branches.flatMap(branch =>
            branch.rooms.filter(room => room.toPublish?.status === true)
        );

        // Fetch unlisted rooms
        const unlistedRooms = branches.flatMap(branch =>
            branch.rooms.filter(room => room.toPublish?.status === false)
        );

        return res.status(200).json({
            success: true,
            message: "Fetched listed and unlisted rooms successfully",
            listedRooms,
            unlistedRooms
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};


exports.listPgRoom = async (req, res) => {
    try {
        const { branchId, roomId, comment } = req.body;

        if (!branchId || !roomId) {
            return res.status(400).json({
                success: false,
                message: "branchId and roomId are required"
            });
        }

        // Find branch
        const branch = await PropertyBranch.findById(branchId);
        if (!branch) {
            return res.status(404).json({ success: false, message: "Branch not found" });
        }

        // Find room
        const room = branch.rooms.id(roomId);
        if (!room) {
            return res.status(404).json({ success: false, message: "Room not found" });
        }

        // Determine bed count
        const bedCount = room.type === "Single" ? 1 : room.type === "Double" ? 2 : 3;

        if (!room.toPublish.status) {
            // List room
            room.toPublish.status = true;
            room.verified = true;
            branch.totalBeds += bedCount;
        } else {
            // Unlist room
            if (!comment) {
                return res.status(400).json({ success: false, message: "Please write the reasons" });
            }
            room.toPublish.status = false;
            room.comment = comment;
            branch.totalBeds -= bedCount;
            room.verified = false;
        }

        room.toPublish.date = new Date();
        await branch.save();

        return res.status(200).json({
            success: true,
            message: "Room updated successfully",
            updatedRoom: room
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

