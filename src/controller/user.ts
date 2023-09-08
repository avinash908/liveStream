import { Request, Response } from "express";
import { UserType } from "../interface/user";
import User from "../model/user";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const isExistUser = async (payload: any) => {
    return await User.find(payload);
}
const saltRounds = 10;
const genratePassword = async (password: string): Promise<string> => {
    var hashPassword: string = "";
    await bcrypt
        .hash(password, saltRounds)
        .then(hash => {
            hashPassword = hash
        })
        .catch(err => {
            hashPassword = "null";
        });
    return hashPassword;
}
const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    var hashPassword: boolean = false;
    await bcrypt
        .compare(password, hash)
        .then(res => {
            hashPassword = res;
        })
        .catch(err => {
            hashPassword = false;
        })
    return hashPassword;
}
const KEY = "4785wdhbcjdfsiuewfwergiq7tdfef"

const createToken = async ({ email, password }: any): Promise<string> => {
    var token = jwt.sign({ user: email + password }, KEY);
    return token;
}

export const userRegister = async (req: Request, res: Response, next: () => void) => {
    if (req.body.username == "" || req.body.username == undefined
        && req.body.email == "" || req.body.email == undefined
        && req.body.password == "" || req.body.password == undefined) {
        return res.status(400).json({
            status: false,
            code: 400,
            message: "All Fields are required username,email,password",
        })
    }
    const payload: UserType = {
        email: req.body.email,
        password: req.body.password,
        username: req.body.username,
        userType: req.body.userType
    }
    const password = await genratePassword(payload.password);
    const token = await createToken({ email: payload.email, password });
    if (password == "" || password == 'null') {
        return res.status(400).json({
            status: false,
            code: 400,
            message: "Password Must bee Strong"
        });
    }
    payload.token = token;
    payload.password = password;
    try {
        const isExist = await isExistUser({ email: payload.email });
        if (isExist.length > 0) {
            return res.status(400).json({
                status: false,
                code: 400,
                message: "Email Address Already Exist",
            });
        } else {
            const user = new User(payload);
            await user.save();
            return res.status(200).json({
                status: true,
                code: 200,
                message: "User Register Successfully",
                data: user,
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


export const login = async (req: Request, res: Response, next: () => void) => {
    if (req.body.email == "" || req.body.email == undefined
        && req.body.password == "" || req.body.password == undefined) {
        return res.status(400).json({
            status: false,
            code: 400,
            message: "All Fields are required email,password",
        })
    }
    const payload: any = {
        email: req.body.email,
        password: req.body.password
    }
    try {
        const isExist = await isExistUser({ email: payload.email });
        if (isExist.length > 0) {
            var isTrue = await comparePassword(payload.password, isExist[0].password);
            if (isTrue == true) {
                if (isExist[0].status) {
                    return res.status(200).json({
                        status: true,
                        code: 200,
                        message: "User Login Successfully",
                        data: isExist[0],
                    });
                } else {
                    return res.status(404).json({
                        status: false,
                        code: 404,
                        message: "your account has been suspended, Please contact to admin",
                    });
                }
            } else {
                return res.status(404).json({
                    status: false,
                    code: 404,
                    message: "Please Check your email or password",
                });
            }
        } else {
            return res.status(404).json({
                status: false,
                code: 404,
                message: "Please Check your email or password",
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



export const onFetchUser = async (req: Request, res: Response, next: () => void) => {
    try {
        const users = await User.find({});
        if (users.length > 0) {
            return res.status(200).json({
                status: true,
                code: 200,
                messsage: "All Users Fetch Successfully",
                data: users,
            });
        } else {
            return res.status(404).json({
                status: false,
                code: 404,
                message: "Users Not Founded",
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