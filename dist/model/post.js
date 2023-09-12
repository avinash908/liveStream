"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Comments = exports.Post = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const post = new mongoose_1.default.Schema({
    "userId": {
        "type": mongoose_1.default.Schema.Types.ObjectId,
        "required": true,
        "ref": 'user'
    },
    "postTitle": {
        "type": String,
        "required": true,
    },
    "postTopic": {
        "categoryId": {
            "type": mongoose_1.default.Schema.Types.ObjectId,
            "required": true,
            "ref": 'category'
        },
        "subCategoryId": {
            "type": mongoose_1.default.Schema.Types.ObjectId,
            "required": false,
            "ref": 'subcategory'
        }
    },
    "postThumbnail": {
        "type": String,
        "required": true,
    },
    "postOrigin": {
        "countryId": {
            "type": mongoose_1.default.Schema.Types.ObjectId,
            "required": true,
            "ref": 'country'
        },
        "stateId": {
            "type": mongoose_1.default.Schema.Types.ObjectId,
            "required": false,
            "ref": 'state'
        },
        "cityId": {
            "type": mongoose_1.default.Schema.Types.ObjectId,
            "required": false,
            "ref": 'city'
        },
        "areaId": {
            "type": mongoose_1.default.Schema.Types.ObjectId,
            "required": false,
            "ref": 'area'
        }
    },
    "likes": {
        "type": (Array),
        "default": [],
    },
    "isLive": {
        "type": "Boolean",
        "default": true,
    },
    "status": {
        "type": "Boolean",
        "default": true,
    },
    "recordedUrl": {
        "type": "String",
        "default": "",
    }
}, {
    timestamps: true
});
post.virtual("comments", {
    ref: "comments",
    foreignField: "postId",
    localField: "_id"
});
const comments = new mongoose_1.default.Schema({
    "postId": {
        "type": mongoose_1.default.Schema.Types.ObjectId,
        "required": true,
        "ref": 'post'
    },
    "fromUserId": {
        "type": mongoose_1.default.Schema.Types.ObjectId,
        "required": true,
        "ref": 'user'
    },
    "comment": {
        "type": "String",
        "required": true
    },
    "status": {
        "type": "Boolean",
        "default": false,
    }
}, { timestamps: true });
const Post = mongoose_1.default.model("post", post);
exports.Post = Post;
const Comments = mongoose_1.default.model("comments", comments);
exports.Comments = Comments;
