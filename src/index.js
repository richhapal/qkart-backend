const mongoose = require("mongoose");
const app = require("./app");
const config = require("./config/config");



// TODO: CRIO_TASK_MODULE_UNDERSTANDING_BASICS - Create Mongo connection and get the express app to listen on config.port



mongoose.connect(config.mongoose.url).then(()=>{
    console.log("Mongoose has been connected",config.mongoose.url)
}).catch((error)=>{console.log(error)});



app.listen(config.port,()=>{console.log("Server is running on port",config.port)})

