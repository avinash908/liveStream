"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const category = new mongoose_1.default.Schema({
    "title": {
        "type": "String"
    },
    "description": {
        "type": "String"
    },
    "status": {
        "type": "Boolean"
    }
}, {
    toJSON: { virtuals: true }
});
category.virtual("subcategory", {
    ref: "subcategory",
    foreignField: "categoryId",
    localField: "_id"
});
const Category = mongoose_1.default.model("category", category);
exports.default = Category;
