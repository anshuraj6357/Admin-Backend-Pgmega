
const mongoose = require("mongoose");




const RoomSchema = new mongoose.Schema({
    roomNumber: Number,
    capacity: Number,
    occupied: {
        type: Number,
        default: 0,
    },
    hoteltype: {
        type: String,
        enum: ["Standard-Single",
            "Standard-Double",
            "Twin-Room",
            "Triple-Room",
            "Family-Room",
            "Deluxe-Room",
            "Super-Deluxe-Room",
            "Executive-Room",
            "Suite"
        ],
    },
    flattype: {
        type: String,
        enum: [
            "1Rk",
            "1BHK",
            "2BHK",
            "3BHK",
            "4BHK",
            "5BHK",
        ],
    },
    roomtype: {
        type: String,
        enum: ["Single", "Double", "Tripe"]
    },
    renttype: {
        type: String,
        enum: ["Flat-Rent", "Room-Rent"]
    },
    type: {
        type: String,
        enum: ["Single", "Double", "Triple"],
    },

    city: {
        type: String
    },
    count: {
        type: Number,
        default: 0,
    },
    verified: {
        type: Boolean,
        default: false
    },


    // ⭐ Added earlier
    description: {
        type: String,
        default: ""
    },

    // ⭐ Added earlier
    notAllowed: [
        {
            type: String,
            enum: [
                "Smoking",
                "Alcohol",
                "Pets",
                "Visitors",
                "Loud Music"
            ]
        }
    ],

    // ⭐ NEW ADDITIONS

    rules: [
        {
            type: String,
            enum: [
                "Keep room clean",
                "No loud music",
                "Maintain hygiene",
                "No outside guests",
                "Respect timings"
            ]
        }
    ],

    allowedFor: {
        type: String,
        enum: ["Boys", "Girls", "Family", "Anyone"],
        default: "Anyone"
    },

    furnishedType: {
        type: String,
        enum: ["Fully Furnished", "Semi Furnished", "Unfurnished"],
    },
    vacant:{
        type:Number,
        default:0,
    },



    availabilityStatus: {
        type: String,
        enum: ["Available", "Occupied"],
        default: "Available"
    },


    toPublish: {
        status: { type: Boolean, default: false },
        date: { type: Date },
    },
    price: Number,
    rentperday: Number,
    rentperhour: Number,
    rentperNight: Number,
    category: {
        type: String,
        enum: ["Pg", "Rented-Room", "Hotel"],
        default: "Pg"
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "branchmanager"
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PropertyBranch"
    },


    roomImages: [
        {
            type: String
        }
    ],

    facilities: [
        {
            type: String,
            enum: [
                "AC",
                "Non-AC",
                "Bathroom",
                "WiFi",
                "Power Backup",
                "Laundry",
                "CCTV",
                "Parking",
                "Refrigerator",
                "24x7 Electricity",
            ]
        }
    ]
});


const propertyBranchSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "Signup", required: true },
    branchmanager: { type: mongoose.Schema.Types.ObjectId, ref: "branchmanager" },
    name: { type: String },
    Rating: { type: Number, default: 0 },
    address: { type: String, required: true },
    city: { type: String },
    streetAdress: { type: String },
    landmark: { type: String },
    state: { type: String },
    pincode: { type: Number },
    totelhotelroom: { type: Number, default: 0 },
    occupiedhotelroom: { type: Number, default: 0 },
    occupiedRentalRoom: { type: Number, default: 0 },
    totalrentalRoom: { type: Number, default: 0 },
    // GeoJSON location (recommended)
    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point",
        },
        coordinates: {
            type: [Number], // [lng, lat]
        },
    },
    // optional flat fields (if you still want them)
    lat: { type: Number },
    long: { type: Number },

    totalBeds: { type: Number, default: 0 },
    facilities: { type: [String] },
    roomNumbers: { type: [Number], required: true },
    advanced: { type: Number, default: 0 },
    dues: { type: Number, default: 0 },
    rent: { type: Number, default: 0 },
    rooms: [RoomSchema],
    occupiedRoom: [{ type: Number }],
    status: {
        enum: ["Active", "InActive", "maintenance", "coming-Soon"],
        type: String,
        default: "Active",
    },
    Propertyphoto: { type: [String] },
}, { timestamps: true });

// Create geospatial index
propertyBranchSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("PropertyBranch", propertyBranchSchema);
