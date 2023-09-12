import mongoose from 'mongoose';


const country = new mongoose.Schema(
    {
        "country": {
            "type": "String",
            "required": true
        },
        "status": {
            "type": "Boolean",
            "required": true
        }
    },
    { timestamps: true, toJSON: { virtuals: true } },
)


country.virtual("state", {
    ref: "state",
    foreignField: "countryId",
    localField: "_id"
});
const state = new mongoose.Schema(
    {
        "countryId": {
            "type": mongoose.Schema.Types.ObjectId, ref: 'country',
            "required": true
        },
        "state": {
            "type": "String",
            "required": true
        },
        "status": {
            "type": "Boolean",
            "required": true
        }
    },
    { timestamps: true, toJSON: { virtuals: true } }
)

state.virtual("city", {
    ref: "city",
    foreignField: "stateId",
    localField: "_id"
});
const city = new mongoose.Schema(
    {
        "countryId": {
            "type": mongoose.Schema.Types.ObjectId, ref: 'country',
            "required": true
        },
        "stateId": {
            "type": mongoose.Schema.Types.ObjectId, ref: 'state',
            "required": true
        },
        "city": {
            "type": "String",
            "required": true
        },
        "status": {
            "type": "Boolean",
            "required": true
        }
    },
    { timestamps: true, toJSON: { virtuals: true } }
)
city.virtual("area", {
    ref: "area",
    foreignField: "cityId",
    localField: "_id"
});
const area = new mongoose.Schema(
    {
        "area": {
            "type": "String",
            "required": true
        },
        "countryId": {
            "type": mongoose.Schema.Types.ObjectId, ref: 'country',
            "required": true
        },
        "stateId": {
            "type": mongoose.Schema.Types.ObjectId, ref: 'state',
            "required": true
        },
        "cityId": {
            "type": mongoose.Schema.Types.ObjectId, ref: 'city',
            "required": true
        },
        "status": {
            "type": "Boolean",
            "required": true
        }
    },
    { timestamps: true, toJSON: { virtuals: true } }
)

const Country = mongoose.model("country", country);
const State = mongoose.model("state", state);
const City = mongoose.model("city", city);
const Area = mongoose.model("area", area);
export { Country, State, City, Area };