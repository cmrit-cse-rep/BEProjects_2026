import mongoose from "mongoose";

const connectDB = async ()=>{
    try{
        const connectionInstance = await mongoose.connect('mongodb+srv://sapa22cs:6wZ8eGR8YBgvxb69@cluster0.ermvtlx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
        console.log(`\nMONGODB CONNECTED !! DB HOST : ${connectionInstance.connection.host}`)
    }catch(error){
        console.log("MONGODB CONNECTION FAILED:\n", error)
        process.exit(1)
    }
}

export default connectDB


// mongodb+srv://shreerakshamrao:y7T9EK8wQoDr6yjp@cluster0.jrblrng.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0