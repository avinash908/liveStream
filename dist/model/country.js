"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Area = exports.City = exports.State = exports.Country = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const country = new mongoose_1.default.Schema({
    "country": {
        "type": "String",
        "required": true
    },
    "status": {
        "type": "Boolean",
        "required": true
    }
}, { timestamps: true, toJSON: { virtuals: true } });
country.virtual("state", {
    ref: "state",
    foreignField: "countryId",
    localField: "_id"
});
const state = new mongoose_1.default.Schema({
    "countryId": {
        "type": mongoose_1.default.Schema.Types.ObjectId, ref: 'country',
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
}, { timestamps: true, toJSON: { virtuals: true } });
state.virtual("city", {
    ref: "city",
    foreignField: "stateId",
    localField: "_id"
});
const city = new mongoose_1.default.Schema({
    "countryId": {
        "type": mongoose_1.default.Schema.Types.ObjectId, ref: 'country',
        "required": true
    },
    "stateId": {
        "type": mongoose_1.default.Schema.Types.ObjectId, ref: 'state',
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
}, { timestamps: true, toJSON: { virtuals: true } });
city.virtual("area", {
    ref: "area",
    foreignField: "cityId",
    localField: "_id"
});
const area = new mongoose_1.default.Schema({
    "area": {
        "type": "String",
        "required": true
    },
    "countryId": {
        "type": mongoose_1.default.Schema.Types.ObjectId, ref: 'country',
        "required": true
    },
    "stateId": {
        "type": mongoose_1.default.Schema.Types.ObjectId, ref: 'state',
        "required": true
    },
    "cityId": {
        "type": mongoose_1.default.Schema.Types.ObjectId, ref: 'city',
        "required": true
    },
    "status": {
        "type": "Boolean",
        "required": true
    }
}, { timestamps: true, toJSON: { virtuals: true } });
const Country = mongoose_1.default.model("country", country);
exports.Country = Country;
const State = mongoose_1.default.model("state", state);
exports.State = State;
const City = mongoose_1.default.model("city", city);
exports.City = City;
const Area = mongoose_1.default.model("area", area);
exports.Area = Area;
