"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const user = new mongoose_1.default.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    token: {
        type: String,
    },
    address: {
        city: {
            type: String,
            default: ""
        },
        state: {
            type: String,
            default: ""
        },
        zipCode: {
            type: String,
            default: ""
        },
        subDivision: {
            type: String,
            default: ""
        },
        country: {
            type: String,
            default: ""
        },
    },
    follower: {
        type: (Array),
        default: [],
    },
    following: {
        type: (Array),
        default: [],
    },
    status: {
        type: Boolean,
        default: true,
    },
    userType: {
        type: String,
        enum: ["Admin", "User"],
        required: true,
    }
}, { timestamps: true });
const User = mongoose_1.default.model("user", user);
exports.default = User;
