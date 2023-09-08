import mongoose from 'mongoose';


const country = new mongoose.Schema(
    {
        "address": {
            "type": "String"
        },
        "city": {
            "type": "String"
        },
        "country": {
            "type": "String",
        },
        "state": {
            "type": "String"
        },
        "zipCode": {
            "type": "String"
        },
        "status": {
            "type": "Boolean"
        }
    }
)

const Country = mongoose.model("country", country);
export default Country;