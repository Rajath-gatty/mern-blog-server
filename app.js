const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const BrowserRoutes = require("./Routes/BrowseRoutes");
const AdminRoutes = require("./Routes/AdminRoutes");
const authRoutes = require("./Routes/authRoutes");

const app = express();
app.use(express.json());

const PORT = process.env.PORT||8080;

app.set("port", PORT);
app.use(cors());

app.use("/", BrowserRoutes);
app.use("/admin", AdminRoutes);
app.use("/auth", authRoutes);

mongoose
    .connect(
        process.env.DATABASE_URL,
        {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }
    )
    .then(() => {
        console.log("connected to database");
        app.listen(PORT);
    })
    .catch((error) => {
        console.log(error);
    });
