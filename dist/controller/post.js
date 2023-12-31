"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePost = exports.getAllPostByCountryStateCityAreaAndCategory = exports.getAllPostByCountryStateCityAndCategory = exports.getAllPostByCountryStateAndCategory = exports.getAllPostByCountryAndCategory = exports.getAllPostsBySubCategory = exports.getAllPostsByCategory = exports.getAllPostsByArea = exports.getAllPostsByCity = exports.getAllPostsByStates = exports.getAllPosts = exports.createPost = void 0;
const joi_1 = __importDefault(require("@hapi/joi"));
const post_1 = require("../model/post");
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const mongoose_1 = __importDefault(require("mongoose"));
aws_sdk_1.default.config.setPromisesDependency(require('bluebird'));
aws_sdk_1.default.config.update({
    accessKeyId: "AKIA3QW5R7CLSAUOQUOI",
    secretAccessKey: "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",
    "region": "us-east-1"
});
;
const postOriginValid = joi_1.default.object({
    countryId: joi_1.default.string().required(),
    stateId: joi_1.default.string(),
    cityId: joi_1.default.string(),
    areaId: joi_1.default.string(),
});
const postTopicValid = joi_1.default.object({
    categoryId: joi_1.default.string().required(),
    subCategoryId: joi_1.default.string(),
});
const validation = joi_1.default.object({
    postTitle: joi_1.default.string().required(),
    userId: joi_1.default.string().required(),
    isLive: joi_1.default.boolean().required(),
    status: joi_1.default.boolean().required(),
    postOrigin: postOriginValid.required().label("Country Id is required"),
    postTopic: postTopicValid.required().label("Category is required"),
});
var s3Bucket = new aws_sdk_1.default.S3();
const createPost = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let payload = {
            postTitle: req.body.postTitle,
            userId: req.body.userId,
            postOrigin: req.body.postOrigin,
            postTopic: req.body.postTopic,
            status: req.body.status,
            isLive: req.body.isLive
        };
        payload = yield validation.validateAsync(payload);
        if (req.body.postThumbnail != '' || req.body.postThumbnail != undefined) {
            var buf = Buffer.from(req.body.postThumbnail.replace(/^data:image\/\w+;base64,/, ""), 'base64');
            const type = req.body.postThumbnail.split(';')[0].split('/')[1];
            const s3Data = {
                Bucket: "postthumbnails",
                Key: payload.userId + Date.now() + "." + type,
                Body: buf,
                ContentEncoding: "base64",
                ContentType: "image/" + type,
            };
            yield s3Bucket.upload(s3Data).promise().then(value => {
                console.log(value.Location);
                payload.postThumbnail = value.Location;
            }).catch(err => {
                return res.status(400).json({
                    statue: false,
                    code: 400,
                    error: err,
                });
            });
        }
        const post = new post_1.Post(payload);
        yield post.save();
        res.status(200).json({
            status: true,
            code: 200,
            message: "Create Post Success",
            data: post,
        });
    }
    catch (error) {
        res.status(500).json({
            status: false,
            code: 500,
            message: "Server Error",
            error: error
        });
    }
    next();
});
exports.createPost = createPost;
const getAllPosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let metch = [
            {
                "$lookup": {
                    "from": "users",
                    "let": { "id": "$userId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$id"] } } },
                    ],
                    "as": "user"
                }
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                "$lookup": {
                    "from": "countries",
                    "let": { "countryId": "$postOrigin.countryId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$countryId"] } } },
                    ],
                    "as": "country"
                }
            },
            {
                $unwind: {
                    path: '$country',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                "$lookup": {
                    "from": "states",
                    "let": { "stateId": "$postOrigin.stateId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$stateId"] } } },
                    ],
                    "as": "states"
                }
            },
            {
                "$lookup": {
                    "from": "cites",
                    "let": { "cityId": "$postOrigin.cityId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$cityId"] } } },
                    ],
                    "as": "cites"
                }
            },
            {
                "$lookup": {
                    "from": "areas",
                    "let": { "areaId": "$postOrigin.areaId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$areaId"] } } },
                    ],
                    "as": "areas"
                }
            },
            {
                "$lookup": {
                    "from": "categories",
                    "let": { "categoryId": "$postTopic.categoryId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$categoryId"] } } },
                    ],
                    "as": "topic"
                }
            },
            {
                $unwind: {
                    path: '$topic',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                "$lookup": {
                    "from": "subcategories",
                    "let": { "subCategoryId": "$postTopic.subCategoryId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$subCategoryId"] } } },
                    ],
                    "as": "subcategories"
                }
            },
            {
                $unwind: {
                    path: '$subcategories',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $sort: { _id: -1 },
            },
            { $limit: 10 }
        ];
        if (req.params.id != 'all') {
            const id = new mongoose_1.default.Types.ObjectId(req.params.id);
            metch.push({
                $match: {
                    "postOrigin.countryId": id
                }
            });
        }
        const posts = yield post_1.Post.aggregate(metch);
        return res.status(200).json({
            status: true,
            code: 200,
            message: "All Post Founded",
            data: posts
        });
    }
    catch (error) {
        return res.status(500).json({
            status: false,
            code: 500,
            message: "Server Error",
            error: error,
        });
    }
});
exports.getAllPosts = getAllPosts;
const getAllPostsByStates = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let metch = [
            {
                "$lookup": {
                    "from": "users",
                    "let": { "id": "$userId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$id"] } } },
                    ],
                    "as": "user"
                }
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                "$lookup": {
                    "from": "countries",
                    "let": { "countryId": "$postOrigin.countryId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$countryId"] } } },
                    ],
                    "as": "country"
                }
            },
            {
                $unwind: {
                    path: '$country',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                "$lookup": {
                    "from": "states",
                    "let": { "stateId": "$postOrigin.stateId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$stateId"] } } },
                    ],
                    "as": "states"
                }
            },
            {
                "$lookup": {
                    "from": "categories",
                    "let": { "categoryId": "$postTopic.categoryId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$categoryId"] } } },
                    ],
                    "as": "topic"
                }
            },
            {
                $unwind: {
                    path: '$topic',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                "$lookup": {
                    "from": "subcategories",
                    "let": { "subCategoryId": "$postTopic.subCategoryId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$subCategoryId"] } } },
                    ],
                    "as": "subcategories"
                }
            },
            {
                $unwind: {
                    path: '$subcategories',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $sort: { _id: -1 },
            },
            { $limit: 10 }
        ];
        if (req.params.id != 'all') {
            const id = new mongoose_1.default.Types.ObjectId(req.params.id);
            const stateId = new mongoose_1.default.Types.ObjectId(req.params.stateId);
            metch.push({
                $match: {
                    $and: [
                        { "postOrigin.stateId": stateId },
                        { "postOrigin.countryId": id }
                    ]
                }
            });
        }
        const posts = yield post_1.Post.aggregate(metch);
        return res.status(200).json({
            status: true,
            code: 200,
            message: "All Post Founded",
            data: posts
        });
    }
    catch (error) {
        return res.status(500).json({
            status: false,
            code: 500,
            message: "Server Error",
            error: error,
        });
    }
});
exports.getAllPostsByStates = getAllPostsByStates;
const getAllPostsByCity = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let metch = [
            {
                "$lookup": {
                    "from": "users",
                    "let": { "id": "$userId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$id"] } } },
                    ],
                    "as": "user"
                }
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                "$lookup": {
                    "from": "countries",
                    "let": { "countryId": "$postOrigin.countryId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$countryId"] } } },
                    ],
                    "as": "country"
                }
            },
            {
                $unwind: {
                    path: '$country',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                "$lookup": {
                    "from": "states",
                    "let": { "stateId": "$postOrigin.stateId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$stateId"] } } },
                    ],
                    "as": "states"
                }
            },
            {
                "$lookup": {
                    "from": "cites",
                    "let": { "cityId": "$postOrigin.cityId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$cityId"] } } },
                    ],
                    "as": "cites"
                }
            },
            {
                "$lookup": {
                    "from": "categories",
                    "let": { "categoryId": "$postTopic.categoryId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$categoryId"] } } },
                    ],
                    "as": "topic"
                }
            },
            {
                $unwind: {
                    path: '$topic',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                "$lookup": {
                    "from": "subcategories",
                    "let": { "subCategoryId": "$postTopic.subCategoryId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$subCategoryId"] } } },
                    ],
                    "as": "subcategories"
                }
            },
            {
                $unwind: {
                    path: '$subcategories',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $sort: { _id: -1 },
            },
            { $limit: 10 }
        ];
        if (req.params.id != 'all') {
            const id = new mongoose_1.default.Types.ObjectId(req.params.id);
            const stateId = new mongoose_1.default.Types.ObjectId(req.params.stateId);
            const cityId = new mongoose_1.default.Types.ObjectId(req.params.cityId);
            metch.push({
                $match: {
                    $and: [
                        { "postOrigin.stateId": stateId },
                        { "postOrigin.countryId": id },
                        { "postOrigin.cityId": cityId }
                    ]
                }
            });
        }
        const posts = yield post_1.Post.aggregate(metch);
        return res.status(200).json({
            status: true,
            code: 200,
            message: "All Post Founded",
            data: posts
        });
    }
    catch (error) {
        return res.status(500).json({
            status: false,
            code: 500,
            message: "Server Error",
            error: error,
        });
    }
});
exports.getAllPostsByCity = getAllPostsByCity;
const getAllPostsByArea = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let metch = [
            {
                "$lookup": {
                    "from": "users",
                    "let": { "id": "$userId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$id"] } } },
                    ],
                    "as": "user"
                }
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                "$lookup": {
                    "from": "countries",
                    "let": { "countryId": "$postOrigin.countryId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$countryId"] } } },
                    ],
                    "as": "country"
                }
            },
            {
                $unwind: {
                    path: '$country',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                "$lookup": {
                    "from": "states",
                    "let": { "stateId": "$postOrigin.stateId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$stateId"] } } },
                    ],
                    "as": "states"
                }
            },
            {
                "$lookup": {
                    "from": "cites",
                    "let": { "cityId": "$postOrigin.cityId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$cityId"] } } },
                    ],
                    "as": "cites"
                }
            },
            {
                "$lookup": {
                    "from": "areas",
                    "let": { "areaId": "$postOrigin.areaId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$areaId"] } } },
                    ],
                    "as": "areas"
                }
            },
            {
                "$lookup": {
                    "from": "categories",
                    "let": { "categoryId": "$postTopic.categoryId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$categoryId"] } } },
                    ],
                    "as": "topic"
                }
            },
            {
                $unwind: {
                    path: '$topic',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                "$lookup": {
                    "from": "subcategories",
                    "let": { "subCategoryId": "$postTopic.subCategoryId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$subCategoryId"] } } },
                    ],
                    "as": "subcategories"
                }
            },
            {
                $unwind: {
                    path: '$subcategories',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $sort: { _id: -1 },
            },
            { $limit: 10 }
        ];
        if (req.params.id != 'all') {
            const id = new mongoose_1.default.Types.ObjectId(req.params.id);
            const stateId = new mongoose_1.default.Types.ObjectId(req.params.stateId);
            const cityId = new mongoose_1.default.Types.ObjectId(req.params.cityId);
            const areaId = new mongoose_1.default.Types.ObjectId(req.params.areaId);
            metch.push({
                $match: {
                    $and: [
                        { "postOrigin.stateId": stateId },
                        { "postOrigin.countryId": id },
                        { "postOrigin.cityId": cityId },
                        { "postOrigin.areaId": areaId },
                    ]
                }
            });
        }
        const posts = yield post_1.Post.aggregate(metch);
        return res.status(200).json({
            status: true,
            code: 200,
            message: "All Post Founded",
            data: posts
        });
    }
    catch (error) {
        return res.status(500).json({
            status: false,
            code: 500,
            message: "Server Error",
            error: error,
        });
    }
});
exports.getAllPostsByArea = getAllPostsByArea;
const getAllPostsByCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let metch = [
            {
                "$lookup": {
                    "from": "users",
                    "let": { "id": "$userId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$id"] } } },
                    ],
                    "as": "user"
                }
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                "$lookup": {
                    "from": "countries",
                    "let": { "countryId": "$postOrigin.countryId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$countryId"] } } },
                    ],
                    "as": "country"
                }
            },
            {
                $unwind: {
                    path: '$country',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                "$lookup": {
                    "from": "states",
                    "let": { "stateId": "$postOrigin.stateId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$stateId"] } } },
                    ],
                    "as": "states"
                }
            },
            {
                "$lookup": {
                    "from": "cites",
                    "let": { "cityId": "$postOrigin.cityId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$cityId"] } } },
                    ],
                    "as": "cites"
                }
            },
            {
                "$lookup": {
                    "from": "areas",
                    "let": { "areaId": "$postOrigin.areaId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$areaId"] } } },
                    ],
                    "as": "areas"
                }
            },
            {
                "$lookup": {
                    "from": "categories",
                    "let": { "categoryId": "$postTopic.categoryId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$categoryId"] } } },
                    ],
                    "as": "topic"
                }
            },
            {
                $unwind: {
                    path: '$topic',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                "$lookup": {
                    "from": "subcategories",
                    "let": { "subCategoryId": "$postTopic.subCategoryId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$subCategoryId"] } } },
                    ],
                    "as": "subcategories"
                }
            },
            {
                $unwind: {
                    path: '$subcategories',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $sort: { _id: -1 },
            },
            { $limit: 10 }
        ];
        if (req.params.id != 'all') {
            const id = new mongoose_1.default.Types.ObjectId(req.params.id);
            metch.push({
                $match: {
                    "postTopic.categoryId": id,
                }
            });
        }
        const posts = yield post_1.Post.aggregate(metch);
        return res.status(200).json({
            status: true,
            code: 200,
            message: "All Post Founded",
            data: posts
        });
    }
    catch (error) {
        return res.status(500).json({
            status: false,
            code: 500,
            message: "Server Error",
            error: error,
        });
    }
});
exports.getAllPostsByCategory = getAllPostsByCategory;
const getAllPostsBySubCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let metch = [
            {
                "$lookup": {
                    "from": "users",
                    "let": { "id": "$userId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$id"] } } },
                    ],
                    "as": "user"
                }
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                "$lookup": {
                    "from": "countries",
                    "let": { "countryId": "$postOrigin.countryId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$countryId"] } } },
                    ],
                    "as": "country"
                }
            },
            {
                $unwind: {
                    path: '$country',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                "$lookup": {
                    "from": "states",
                    "let": { "stateId": "$postOrigin.stateId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$stateId"] } } },
                    ],
                    "as": "states"
                }
            },
            {
                "$lookup": {
                    "from": "cites",
                    "let": { "cityId": "$postOrigin.cityId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$cityId"] } } },
                    ],
                    "as": "cites"
                }
            },
            {
                "$lookup": {
                    "from": "areas",
                    "let": { "areaId": "$postOrigin.areaId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$areaId"] } } },
                    ],
                    "as": "areas"
                }
            },
            {
                "$lookup": {
                    "from": "categories",
                    "let": { "categoryId": "$postTopic.categoryId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$categoryId"] } } },
                    ],
                    "as": "topic"
                }
            },
            {
                $unwind: {
                    path: '$topic',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                "$lookup": {
                    "from": "subcategories",
                    "let": { "subCategoryId": "$postTopic.subCategoryId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$subCategoryId"] } } },
                    ],
                    "as": "subcategories"
                }
            },
            {
                $unwind: {
                    path: '$subcategories',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $sort: { _id: -1 },
            },
            { $limit: 10 }
        ];
        if (req.params.id != 'all') {
            const id = new mongoose_1.default.Types.ObjectId(req.params.id);
            const subcategoryId = new mongoose_1.default.Types.ObjectId(req.params.subcategoryId);
            metch.push({
                $match: {
                    $and: [
                        { "postTopic.categoryId": id },
                        { "postTopic.subCategoryId": subcategoryId }
                    ]
                }
            });
        }
        const posts = yield post_1.Post.aggregate(metch);
        return res.status(200).json({
            status: true,
            code: 200,
            message: "All Post Founded",
            data: posts
        });
    }
    catch (error) {
        return res.status(500).json({
            status: false,
            code: 500,
            message: "Server Error",
            error: error,
        });
    }
});
exports.getAllPostsBySubCategory = getAllPostsBySubCategory;
const getAllPostByCountryAndCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let metch = [
            {
                "$lookup": {
                    "from": "users",
                    "let": { "id": "$userId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$id"] } } },
                    ],
                    "as": "user"
                }
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                "$lookup": {
                    "from": "countries",
                    "let": { "countryId": "$postOrigin.countryId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$countryId"] } } },
                    ],
                    "as": "country"
                }
            },
            {
                $unwind: {
                    path: '$country',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                "$lookup": {
                    "from": "states",
                    "let": { "stateId": "$postOrigin.stateId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$stateId"] } } },
                    ],
                    "as": "states"
                }
            },
            {
                "$lookup": {
                    "from": "cites",
                    "let": { "cityId": "$postOrigin.cityId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$cityId"] } } },
                    ],
                    "as": "cites"
                }
            },
            {
                "$lookup": {
                    "from": "areas",
                    "let": { "areaId": "$postOrigin.areaId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$areaId"] } } },
                    ],
                    "as": "areas"
                }
            },
            {
                "$lookup": {
                    "from": "categories",
                    "let": { "categoryId": "$postTopic.categoryId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$categoryId"] } } },
                    ],
                    "as": "topic"
                }
            },
            {
                $unwind: {
                    path: '$topic',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                "$lookup": {
                    "from": "subcategories",
                    "let": { "subCategoryId": "$postTopic.subCategoryId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$subCategoryId"] } } },
                    ],
                    "as": "subcategories"
                }
            },
            {
                $unwind: {
                    path: '$subcategories',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $sort: { _id: -1 },
            },
            { $limit: 10 }
        ];
        if (req.params.id != 'all') {
            const id = new mongoose_1.default.Types.ObjectId(req.params.countryId);
            const categoryId = new mongoose_1.default.Types.ObjectId(req.params.categoryId);
            metch.push({
                $match: {
                    $and: [
                        { "postTopic.categoryId": categoryId },
                        { "postOrigin.countryId": id }
                    ]
                }
            });
        }
        const posts = yield post_1.Post.aggregate(metch);
        return res.status(200).json({
            status: true,
            code: 200,
            message: "All Post Founded",
            data: posts
        });
    }
    catch (error) {
        return res.status(500).json({
            status: false,
            code: 500,
            message: "Server Error",
            error: error,
        });
    }
});
exports.getAllPostByCountryAndCategory = getAllPostByCountryAndCategory;
const getAllPostByCountryStateAndCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let metch = [
            {
                "$lookup": {
                    "from": "users",
                    "let": { "id": "$userId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$id"] } } },
                    ],
                    "as": "user"
                }
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                "$lookup": {
                    "from": "countries",
                    "let": { "countryId": "$postOrigin.countryId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$countryId"] } } },
                    ],
                    "as": "country"
                }
            },
            {
                $unwind: {
                    path: '$country',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                "$lookup": {
                    "from": "states",
                    "let": { "stateId": "$postOrigin.stateId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$stateId"] } } },
                    ],
                    "as": "states"
                }
            },
            {
                "$lookup": {
                    "from": "cites",
                    "let": { "cityId": "$postOrigin.cityId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$cityId"] } } },
                    ],
                    "as": "cites"
                }
            },
            {
                "$lookup": {
                    "from": "areas",
                    "let": { "areaId": "$postOrigin.areaId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$areaId"] } } },
                    ],
                    "as": "areas"
                }
            },
            {
                "$lookup": {
                    "from": "categories",
                    "let": { "categoryId": "$postTopic.categoryId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$categoryId"] } } },
                    ],
                    "as": "topic"
                }
            },
            {
                $unwind: {
                    path: '$topic',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                "$lookup": {
                    "from": "subcategories",
                    "let": { "subCategoryId": "$postTopic.subCategoryId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$subCategoryId"] } } },
                    ],
                    "as": "subcategories"
                }
            },
            {
                $unwind: {
                    path: '$subcategories',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $sort: { _id: -1 },
            },
            { $limit: 10 }
        ];
        if (req.params.id != 'all') {
            const id = new mongoose_1.default.Types.ObjectId(req.params.countryId);
            const categoryId = new mongoose_1.default.Types.ObjectId(req.params.categoryId);
            const sateId = new mongoose_1.default.Types.ObjectId(req.params.stateId);
            metch.push({
                $match: {
                    $and: [
                        { "postTopic.categoryId": categoryId },
                        { "postOrigin.stateId": sateId },
                        { "postOrigin.countryId": id }
                    ]
                }
            });
        }
        const posts = yield post_1.Post.aggregate(metch);
        return res.status(200).json({
            status: true,
            code: 200,
            message: "All Post Founded",
            data: posts
        });
    }
    catch (error) {
        return res.status(500).json({
            status: false,
            code: 500,
            message: "Server Error",
            error: error,
        });
    }
});
exports.getAllPostByCountryStateAndCategory = getAllPostByCountryStateAndCategory;
const getAllPostByCountryStateCityAndCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let metch = [
            {
                "$lookup": {
                    "from": "users",
                    "let": { "id": "$userId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$id"] } } },
                    ],
                    "as": "user"
                }
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                "$lookup": {
                    "from": "countries",
                    "let": { "countryId": "$postOrigin.countryId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$countryId"] } } },
                    ],
                    "as": "country"
                }
            },
            {
                $unwind: {
                    path: '$country',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                "$lookup": {
                    "from": "states",
                    "let": { "stateId": "$postOrigin.stateId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$stateId"] } } },
                    ],
                    "as": "states"
                }
            },
            {
                "$lookup": {
                    "from": "cites",
                    "let": { "cityId": "$postOrigin.cityId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$cityId"] } } },
                    ],
                    "as": "cites"
                }
            },
            {
                "$lookup": {
                    "from": "areas",
                    "let": { "areaId": "$postOrigin.areaId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$areaId"] } } },
                    ],
                    "as": "areas"
                }
            },
            {
                "$lookup": {
                    "from": "categories",
                    "let": { "categoryId": "$postTopic.categoryId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$categoryId"] } } },
                    ],
                    "as": "topic"
                }
            },
            {
                $unwind: {
                    path: '$topic',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                "$lookup": {
                    "from": "subcategories",
                    "let": { "subCategoryId": "$postTopic.subCategoryId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$subCategoryId"] } } },
                    ],
                    "as": "subcategories"
                }
            },
            {
                $unwind: {
                    path: '$subcategories',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $sort: { _id: -1 },
            },
            { $limit: 10 }
        ];
        if (req.params.id != 'all') {
            const id = new mongoose_1.default.Types.ObjectId(req.params.countryId);
            const categoryId = new mongoose_1.default.Types.ObjectId(req.params.categoryId);
            const sateId = new mongoose_1.default.Types.ObjectId(req.params.stateId);
            const cityId = new mongoose_1.default.Types.ObjectId(req.params.cityId);
            metch.push({
                $match: {
                    $and: [
                        { "postTopic.categoryId": categoryId },
                        { "postOrigin.stateId": sateId },
                        { "postOrigin.cityId": cityId },
                        { "postOrigin.countryId": id }
                    ]
                }
            });
        }
        const posts = yield post_1.Post.aggregate(metch);
        return res.status(200).json({
            status: true,
            code: 200,
            message: "All Post Founded",
            data: posts
        });
    }
    catch (error) {
        return res.status(500).json({
            status: false,
            code: 500,
            message: "Server Error",
            error: error,
        });
    }
});
exports.getAllPostByCountryStateCityAndCategory = getAllPostByCountryStateCityAndCategory;
const getAllPostByCountryStateCityAreaAndCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let metch = [
            {
                "$lookup": {
                    "from": "users",
                    "let": { "id": "$userId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$id"] } } },
                    ],
                    "as": "user"
                }
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                "$lookup": {
                    "from": "countries",
                    "let": { "countryId": "$postOrigin.countryId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$countryId"] } } },
                    ],
                    "as": "country"
                }
            },
            {
                $unwind: {
                    path: '$country',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                "$lookup": {
                    "from": "states",
                    "let": { "stateId": "$postOrigin.stateId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$stateId"] } } },
                    ],
                    "as": "states"
                }
            },
            {
                "$lookup": {
                    "from": "cites",
                    "let": { "cityId": "$postOrigin.cityId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$cityId"] } } },
                    ],
                    "as": "cites"
                }
            },
            {
                "$lookup": {
                    "from": "areas",
                    "let": { "areaId": "$postOrigin.areaId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$areaId"] } } },
                    ],
                    "as": "areas"
                }
            },
            {
                "$lookup": {
                    "from": "categories",
                    "let": { "categoryId": "$postTopic.categoryId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$categoryId"] } } },
                    ],
                    "as": "topic"
                }
            },
            {
                $unwind: {
                    path: '$topic',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                "$lookup": {
                    "from": "subcategories",
                    "let": { "subCategoryId": "$postTopic.subCategoryId" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$_id", "$$subCategoryId"] } } },
                    ],
                    "as": "subcategories"
                }
            },
            {
                $unwind: {
                    path: '$subcategories',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $sort: { _id: -1 },
            },
            { $limit: 10 }
        ];
        if (req.params.id != 'all') {
            const id = new mongoose_1.default.Types.ObjectId(req.params.countryId);
            const categoryId = new mongoose_1.default.Types.ObjectId(req.params.categoryId);
            const sateId = new mongoose_1.default.Types.ObjectId(req.params.stateId);
            const cityId = new mongoose_1.default.Types.ObjectId(req.params.cityId);
            const areaId = new mongoose_1.default.Types.ObjectId(req.params.areaId);
            metch.push({
                $match: {
                    $and: [
                        { "postTopic.categoryId": categoryId },
                        { "postOrigin.stateId": sateId },
                        { "postOrigin.cityId": cityId },
                        { "postOrigin.areaId": areaId },
                        { "postOrigin.countryId": id }
                    ]
                }
            });
        }
        const posts = yield post_1.Post.aggregate(metch);
        return res.status(200).json({
            status: true,
            code: 200,
            message: "All Post Founded",
            data: posts
        });
    }
    catch (error) {
        return res.status(500).json({
            status: false,
            code: 500,
            message: "Server Error",
            error: error,
        });
    }
});
exports.getAllPostByCountryStateCityAreaAndCategory = getAllPostByCountryStateCityAreaAndCategory;
const deletePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const posts = yield post_1.Post.findByIdAndDelete(req.params.id);
        return res.status(200).json({
            status: true,
            code: 200,
            message: "delete Successfully",
            data: posts
        });
    }
    catch (error) {
        return res.status(500).json({
            status: false,
            code: 500,
            message: "Server Error",
            error: error,
        });
    }
});
exports.deletePost = deletePost;
