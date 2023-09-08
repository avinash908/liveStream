"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const subcategory = new mongoose_1.default.Schema({
    "categoryId": {
        "type": mongoose_1.default.Schema.Types.ObjectId, ref: 'category'
    },
    "title": {
        "type": "String"
    },
    "description": {
        "type": "String"
    },
    "status": {
        "type": "Boolean"
    }
});
const SubCategory = mongoose_1.default.model("subcategory", subcategory);
exports.default = SubCategory;
