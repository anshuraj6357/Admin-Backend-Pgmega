const  express  = require("express");
const { mongoose } = require("mongoose");
const  dotenv  = require("dotenv")
const cors=require("cors")
const userRouter=require("./router/user")
const propertyRouter=require("./router/property")
const tenantRouter=require("./router/tenenant")
const complainRouter=require("./router/complain")
const analyticsRouter=require("./router/analysis")
const staffRouter=require("./router/staff")
const paymentRouter=require("./router/payment")
const  cookieparser  = require("cookie-parser")



const app = express();
dotenv.config();


app.use(express.json());
app.use(cookieparser());
app.use(express.urlencoded({ extended: true })); 
app.use(cors({
  origin:["http://localhost:5173","http://localhost:5174"],
  credentials:true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
     allowedHeaders: ["Content-Type", "Authorization"],
}));app.options(/.*/, cors());


app.use("/api/v1/user",userRouter)
app.use("/api/property",propertyRouter)
app.use("/api/tenant",tenantRouter)
app.use("/api",complainRouter)
app.use("/api",analyticsRouter)
app.use("/api/staff",staffRouter)
app.use("/api/payment",paymentRouter)

mongoose
    .connect(process.env.MONGODB_URL)
    .then(() => { console.log("your  database is connected") })
    .catch((error) => {
        console.log("something webt wrong in database");
        console.error("your error is ", error);
        process.exit(1);
    })



app.get('/', async (req, res) => {
    res.send("Server is running on this port ")
})

app.listen("5000", () => {
    console.log("server is runninng !");

})

