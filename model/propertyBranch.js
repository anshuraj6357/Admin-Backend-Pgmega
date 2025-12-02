const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
    roomNumber: Number,
    capacity: Number,
    occupied: Number,
    type: String,
    city: {
        type: String
    },
    count:{
        type:Number,
        default:0,
    },
    comment: {
        type: String
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
        enum: ["Pg", "Room"],
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
