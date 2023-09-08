import mongoose from "mongoose";
import { config } from 'dotenv'
// mongodb+srv://avinashjeswani908:<password>@cluster0.da3scfr.mongodb.net/?retryWrites=true&w=majority

config();


const URI = process.env.MONGOOSEURI;



const dbConnect = async () => {
    await mongoose.connect(URI!)
        .then(() => console.log('Connected!')).catch((error) => {
            console.log(error);
        });
}

export { dbConnect };
// "Avinash@@123";