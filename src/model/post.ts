import mongoose from 'mongoose';


const post = new mongoose.Schema(
    {
        "userId": {
            "type": mongoose.Schema.Types.ObjectId,
            "required": true,
            "ref": 'user'
        },
        "postTitle": {
            "type": String,
            "required": true,
        },
        "postTopic": {
            "categoryId": {
                "type": mongoose.Schema.Types.ObjectId,
                "required": true,
                "ref": 'category'
            },
            "subCategoryId": {
                "type": mongoose.Schema.Types.ObjectId,
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
                "type": mongoose.Schema.Types.ObjectId,
                "required": true,
                "ref": 'country'
            },
            "stateId": {
                "type": mongoose.Schema.Types.ObjectId,
                "required": false,
                "ref": 'state'
            },
            "cityId": {
                "type": mongoose.Schema.Types.ObjectId,
                "required": false,
                "ref": 'city'
            },
            "areaId": {
                "type": mongoose.Schema.Types.ObjectId,
                "required": false,
                "ref": 'area'
            }
        },
        "likes": {
            "type": Array<String>,
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
    },
    {
        timestamps: true
    }
);
post.virtual("comments", {
    ref: "comments",
    foreignField: "postId",
    localField: "_id"
});
const comments = new mongoose.Schema({
    "postId": {
        "type": mongoose.Schema.Types.ObjectId,
        "required": true,
        "ref": 'post'
    },
    "fromUserId": {
        "type": mongoose.Schema.Types.ObjectId,
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
const Post = mongoose.model("post", post);
const Comments = mongoose.model("comments", comments);
export { Post, Comments };