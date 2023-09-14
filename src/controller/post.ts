import { Request, Response } from "express";
import { PostType } from "../interface/post";
import Joi from '@hapi/joi'
import { Post } from "../model/post";
import AWS from 'aws-sdk';
import mongoose from "mongoose";
AWS.config.setPromisesDependency(require('bluebird'));

AWS.config.update({
    accessKeyId: "AKIA3QW5R7CLSAUOQUOI",
    secretAccessKey: "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",
    "region": "us-east-1"
});;
const postOriginValid = Joi.object({
    countryId: Joi.string().required(),
    stateId: Joi.string(),
    cityId: Joi.string(),
    areaId: Joi.string(),
});

const postTopicValid = Joi.object({
    categoryId: Joi.string().required(),
    subCategoryId: Joi.string(),
});

const validation = Joi.object({
    postTitle: Joi.string().required(),
    userId: Joi.string().required(),
    isLive: Joi.boolean().required(),
    status: Joi.boolean().required(),
    postOrigin: postOriginValid.required().label("Country Id is required"),
    postTopic: postTopicValid.required().label("Category is required"),
});


var s3Bucket = new AWS.S3();

export const createPost = async (req: Request, res: Response, next: () => void) => {
    try {
        let payload: PostType = {
            postTitle: req.body.postTitle,
            userId: req.body.userId,
            postOrigin: req.body.postOrigin,
            postTopic: req.body.postTopic,
            status: req.body.status,
            isLive: req.body.isLive
        }
        payload = await validation.validateAsync(payload);
        if (req.body.postThumbnail != '' || req.body.postThumbnail != undefined) {
            var buf = Buffer.from(req.body.postThumbnail.replace(/^data:image\/\w+;base64,/, ""), 'base64')
            const type = req.body.postThumbnail.split(';')[0].split('/')[1];
            const s3Data = {
                Bucket: "postthumbnails",
                Key: payload.userId + Date.now() + "." + type,
                Body: buf,
                ContentEncoding: "base64",
                ContentType: "image/" + type,
            }
            await s3Bucket.upload(s3Data).promise().then(value => {
                console.log(value.Location);
                payload.postThumbnail = value.Location;
            }).catch(err => {
                return res.status(400).json({
                    statue: false,
                    code: 400,
                    error: err,
                })
            });
        }
        const post = new Post(payload);
        await post.save();
        res.status(200).json({
            status: true,
            code: 200,
            message: "Create Post Success",
            data: post,
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            code: 500,
            message: "Server Error",
            error: error
        });
    }
    next();
}



export const getAllPosts = async (req: Request, res: Response) => {
    try {
        let metch: Array<any> = [
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
                $unwind:
                {
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
                $unwind:
                {
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
                $unwind:
                {
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
                $unwind:
                {
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
            const id = new mongoose.Types.ObjectId(req.params.id);
            metch.push({
                $match: {
                    "postOrigin.countryId": id
                }
            });
        }
        const posts = await Post.aggregate(metch);
        return res.status(200).json({
            status: true,
            code: 200,
            message: "All Post Founded",
            data: posts
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            code: 500,
            message: "Server Error",
            error: error,
        });
    }

}



export const getAllPostsByStates = async (req: Request, res: Response) => {
    try {
        let metch: Array<any> = [
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
                $unwind:
                {
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
                $unwind:
                {
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
                $unwind:
                {
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
                $unwind:
                {
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
            const id = new mongoose.Types.ObjectId(req.params.id);
            const stateId = new mongoose.Types.ObjectId(req.params.stateId);

            metch.push({
                $match: {
                    $and: [
                        { "postOrigin.stateId": stateId },
                        { "postOrigin.countryId": id }
                    ]
                }
            });
        }
        const posts = await Post.aggregate(metch);
        return res.status(200).json({
            status: true,
            code: 200,
            message: "All Post Founded",
            data: posts
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            code: 500,
            message: "Server Error",
            error: error,
        });
    }
}

export const getAllPostsByCity = async (req: Request, res: Response) => {
    try {
        let metch: Array<any> = [
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
                $unwind:
                {
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
                $unwind:
                {
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
                $unwind:
                {
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
                $unwind:
                {
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
            const id = new mongoose.Types.ObjectId(req.params.id);
            const stateId = new mongoose.Types.ObjectId(req.params.stateId);
            const cityId = new mongoose.Types.ObjectId(req.params.cityId);
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
        const posts = await Post.aggregate(metch);
        return res.status(200).json({
            status: true,
            code: 200,
            message: "All Post Founded",
            data: posts
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            code: 500,
            message: "Server Error",
            error: error,
        });
    }
}
export const getAllPostsByArea = async (req: Request, res: Response) => {
    try {
        let metch: Array<any> = [
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
                $unwind:
                {
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
                $unwind:
                {
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
                $unwind:
                {
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
                $unwind:
                {
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
            const id = new mongoose.Types.ObjectId(req.params.id);
            const stateId = new mongoose.Types.ObjectId(req.params.stateId);
            const cityId = new mongoose.Types.ObjectId(req.params.cityId);
            const areaId = new mongoose.Types.ObjectId(req.params.areaId);
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
        const posts = await Post.aggregate(metch);
        return res.status(200).json({
            status: true,
            code: 200,
            message: "All Post Founded",
            data: posts
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            code: 500,
            message: "Server Error",
            error: error,
        });
    }
}


export const getAllPostsByCategory = async (req: Request, res: Response) => {
    try {
        let metch: Array<any> = [
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
                $unwind:
                {
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
                $unwind:
                {
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
                $unwind:
                {
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
                $unwind:
                {
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
            const id = new mongoose.Types.ObjectId(req.params.id);
            metch.push({
                $match: {
                    "postTopic.categoryId": id,
                }
            });
        }
        const posts = await Post.aggregate(metch);
        return res.status(200).json({
            status: true,
            code: 200,
            message: "All Post Founded",
            data: posts
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            code: 500,
            message: "Server Error",
            error: error,
        });
    }
}



export const getAllPostsBySubCategory = async (req: Request, res: Response) => {
    try {
        let metch: Array<any> = [
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
                $unwind:
                {
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
                $unwind:
                {
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
                $unwind:
                {
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
                $unwind:
                {
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
            const id = new mongoose.Types.ObjectId(req.params.id);
            const subcategoryId = new mongoose.Types.ObjectId(req.params.subcategoryId);
            metch.push({
                $match: {
                    $and: [
                        { "postTopic.categoryId": id },
                        { "postTopic.subCategoryId": subcategoryId }
                    ]
                }
            });
        }
        const posts = await Post.aggregate(metch);
        return res.status(200).json({
            status: true,
            code: 200,
            message: "All Post Founded",
            data: posts
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            code: 500,
            message: "Server Error",
            error: error,
        });
    }
}



export const getAllPostByCountryAndCategory = async (req: Request, res: Response) => {
    try {
        let metch: Array<any> = [
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
                $unwind:
                {
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
                $unwind:
                {
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
                $unwind:
                {
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
                $unwind:
                {
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
            const id = new mongoose.Types.ObjectId(req.params.countryId);
            const categoryId = new mongoose.Types.ObjectId(req.params.categoryId);
            metch.push({
                $match: {
                    $and: [
                        { "postTopic.categoryId": categoryId },
                        { "postOrigin.countryId": id }
                    ]
                }
            });
        }
        const posts = await Post.aggregate(metch);
        return res.status(200).json({
            status: true,
            code: 200,
            message: "All Post Founded",
            data: posts
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            code: 500,
            message: "Server Error",
            error: error,
        });
    }
}




export const getAllPostByCountryStateAndCategory = async (req: Request, res: Response) => {
    try {
        let metch: Array<any> = [
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
                $unwind:
                {
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
                $unwind:
                {
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
                $unwind:
                {
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
                $unwind:
                {
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
            const id = new mongoose.Types.ObjectId(req.params.countryId);
            const categoryId = new mongoose.Types.ObjectId(req.params.categoryId);
            const sateId = new mongoose.Types.ObjectId(req.params.stateId);

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
        const posts = await Post.aggregate(metch);
        return res.status(200).json({
            status: true,
            code: 200,
            message: "All Post Founded",
            data: posts
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            code: 500,
            message: "Server Error",
            error: error,
        });
    }
}




export const getAllPostByCountryStateCityAndCategory = async (req: Request, res: Response) => {
    try {
        let metch: Array<any> = [
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
                $unwind:
                {
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
                $unwind:
                {
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
                $unwind:
                {
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
                $unwind:
                {
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
            const id = new mongoose.Types.ObjectId(req.params.countryId);
            const categoryId = new mongoose.Types.ObjectId(req.params.categoryId);
            const sateId = new mongoose.Types.ObjectId(req.params.stateId);
            const cityId = new mongoose.Types.ObjectId(req.params.cityId);


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
        const posts = await Post.aggregate(metch);
        return res.status(200).json({
            status: true,
            code: 200,
            message: "All Post Founded",
            data: posts
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            code: 500,
            message: "Server Error",
            error: error,
        });
    }
}



export const getAllPostByCountryStateCityAreaAndCategory = async (req: Request, res: Response) => {
    try {
        let metch: Array<any> = [
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
                $unwind:
                {
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
                $unwind:
                {
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
                $unwind:
                {
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
                $unwind:
                {
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
            const id = new mongoose.Types.ObjectId(req.params.countryId);
            const categoryId = new mongoose.Types.ObjectId(req.params.categoryId);
            const sateId = new mongoose.Types.ObjectId(req.params.stateId);
            const cityId = new mongoose.Types.ObjectId(req.params.cityId);
            const areaId = new mongoose.Types.ObjectId(req.params.areaId);
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
        const posts = await Post.aggregate(metch);
        return res.status(200).json({
            status: true,
            code: 200,
            message: "All Post Founded",
            data: posts
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            code: 500,
            message: "Server Error",
            error: error,
        });
    }
}
export const deletePost = async (req: Request, res: Response) => {
    try {
        const posts = await Post.findByIdAndDelete(req.params.id);
        return res.status(200).json({
            status: true,
            code: 200,
            message: "delete Successfully",
            data: posts
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            code: 500,
            message: "Server Error",
            error: error,
        });
    }
}