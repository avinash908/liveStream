import mongoose from 'mongoose';


const user = new mongoose.Schema({
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
        type: Array<String>,
        default: [],
    },
    following: {
        type: Array<String>,
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

const User = mongoose.model("user", user);

export default User;