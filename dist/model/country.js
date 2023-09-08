"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const country = new mongoose_1.default.Schema({
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
});
const Country = mongoose_1.default.model("country", country);
exports.default = Country;
