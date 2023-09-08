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
exports.getMenuTopics = exports.getAllSubCategory = exports.addSubCategory = exports.getAllCategory = exports.addCategory = void 0;
const category_1 = __importDefault(require("../model/category"));
const subcategory_1 = __importDefault(require("../model/subcategory"));
const addCategory = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = {
        title: req.body.title,
        description: req.body.description,
        status: req.body.status
    };
    try {
        const category = new category_1.default(payload);
        yield category.save();
        return res.status(200).json({
            status: true,
            code: 200,
            message: "Category Add Success",
            data: category
        });
    }
    catch (error) {
        res.status(500).json({
            status: false,
            code: 500,
            messsage: "Server Error",
            error: error
        });
    }
    next();
});
exports.addCategory = addCategory;
const getAllCategory = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const category = yield category_1.default.find({});
        if (category.length > 0) {
            return res.status(200).json({
                status: true,
                code: 200,
                message: "Category Add Success",
                data: category
            });
        }
        else {
            return res.status(404).json({
                status: false,
                code: 404,
                message: "Category Not Founded",
                data: category
            });
        }
    }
    catch (error) {
        res.status(500).json({
            status: false,
            code: 500,
            messsage: "Server Error",
            error: error
        });
    }
    next();
});
exports.getAllCategory = getAllCategory;
const addSubCategory = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = {
        title: req.body.title,
        description: req.body.description,
        status: req.body.status,
        categoryId: req.body.categoryId
    };
    try {
        const category = new subcategory_1.default(payload);
        yield category.save();
        return res.status(200).json({
            status: true,
            code: 200,
            message: "Sub Category Add Success",
            data: category
        });
    }
    catch (error) {
        res.status(500).json({
            status: false,
            code: 500,
            messsage: "Server Error",
            error: error
        });
    }
    next();
});
exports.addSubCategory = addSubCategory;
const getAllSubCategory = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const category = yield subcategory_1.default.find({});
        if (category.length > 0) {
            return res.status(200).json({
                status: true,
                code: 200,
                message: "Sub Category Add Success",
                data: category
            });
        }
        else {
            return res.status(404).json({
                status: false,
                code: 404,
                message: "Sub Category Not Founded",
                data: category
            });
        }
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
exports.getAllSubCategory = getAllSubCategory;
const getMenuTopics = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const menuTopics = yield category_1.default.find({}).populate({
            path: "subcategory",
        });
        if (menuTopics.length > 0) {
            return res.status(200).json({
                status: true,
                code: 200,
                message: "menuTopics Add Success",
                data: menuTopics
            });
        }
        else {
            return res.status(404).json({
                status: false,
                code: 404,
                message: "menuTopics Not Founded",
                data: menuTopics
            });
        }
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
exports.getMenuTopics = getMenuTopics;
