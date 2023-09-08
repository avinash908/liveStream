import { Request, Response } from "express";
import Category from "../model/category";
import SubCategory from "../model/subcategory";



export const addCategory = async (req: Request, res: Response, next: () => void) => {
    const payload: any = {
        title: req.body.title,
        description: req.body.description,
        status: req.body.status
    };
    try {
        const category = new Category(payload);
        await category.save();
        return res.status(200).json({
            status: true,
            code: 200,
            message: "Category Add Success",
            data: category
        })
    } catch (error) {
        res.status(500).json({
            status: false,
            code: 500,
            messsage: "Server Error",
            error: error
        });
    }
    next();
}

export const getAllCategory = async (req: Request, res: Response, next: () => void) => {
    try {
        const category = await Category.find({});
        if (category.length > 0) {
            return res.status(200).json({
                status: true,
                code: 200,
                message: "Category Add Success",
                data: category
            });
        } else {
            return res.status(404).json({
                status: false,
                code: 404,
                message: "Category Not Founded",
                data: category
            });
        }
    } catch (error) {
        res.status(500).json({
            status: false,
            code: 500,
            messsage: "Server Error",
            error: error
        });
    }
    next();
}

export const addSubCategory = async (req: Request, res: Response, next: () => void) => {
    const payload: any = {
        title: req.body.title,
        description: req.body.description,
        status: req.body.status,
        categoryId: req.body.categoryId
    };
    try {
        const category = new SubCategory(payload);
        await category.save();
        return res.status(200).json({
            status: true,
            code: 200,
            message: "Sub Category Add Success",
            data: category
        })
    } catch (error) {
        res.status(500).json({
            status: false,
            code: 500,
            messsage: "Server Error",
            error: error
        });
    }
    next();
}

export const getAllSubCategory = async (req: Request, res: Response, next: () => void) => {
    try {
        const category = await SubCategory.find({});
        if (category.length > 0) {
            return res.status(200).json({
                status: true,
                code: 200,
                message: "Sub Category Add Success",
                data: category
            });
        } else {
            return res.status(404).json({
                status: false,
                code: 404,
                message: "Sub Category Not Founded",
                data: category
            });
        }
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


export const getMenuTopics = async (req: Request, res: Response, next: () => void) => {
    try {
        const menuTopics = await Category.find({}).populate({
            path:"subcategory",
        })
        if (menuTopics.length > 0) {
            return res.status(200).json({
                status: true,
                code: 200,
                message: "menuTopics Add Success",
                data: menuTopics
            });
        } else {
            return res.status(404).json({
                status: false,
                code: 404,
                message: "menuTopics Not Founded",
                data: menuTopics
            });
        }
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