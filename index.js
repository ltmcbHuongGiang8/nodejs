const express = require("express");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");
var bodyParser = require("body-parser");
const morgan = require("morgan");
const helmet = require("helmet");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes"); // Đảm bảo đường dẫn này đúng

require("dotenv").config();

//Kết nối server
const mongoURI = 'mongodb+srv://huonggiangdao:08088880@cluster0.jzfkr.mongodb.net/appnew?retryWrites=true&w=majority&appName=Cluster0';


mongoose.connect(mongoURI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));


app.use(bodyParser.json({limit:"50mb"}));
app.use(helmet());
app.use(cors());
app.use(morgan("common"));

app.use("/users", userRoutes);

app.listen(process.env.PORT || 8080, () => {
  console.log('Server is running on port', process.env.PORT || 8080);

});