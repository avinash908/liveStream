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
exports.onFetchUser = exports.login = exports.userRegister = void 0;
const user_1 = __importDefault(require("../model/user"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const isExistUser = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    return yield user_1.default.find(payload);
});
const saltRounds = 10;
const genratePassword = (password) => __awaiter(void 0, void 0, void 0, function* () {
    var hashPassword = "";
    yield bcrypt_1.default
        .hash(password, saltRounds)
        .then(hash => {
        hashPassword = hash;
    })
        .catch(err => {
        hashPassword = "null";
    });
    return hashPassword;
});
const comparePassword = (password, hash) => __awaiter(void 0, void 0, void 0, function* () {
    var hashPassword = false;
    yield bcrypt_1.default
        .compare(password, hash)
        .then(res => {
        hashPassword = res;
    })
        .catch(err => {
        hashPassword = false;
    });
    return hashPassword;
});
const KEY = "4785wdhbcjdfsiuewfwergiq7tdfef";
const createToken = ({ email, password }) => __awaiter(void 0, void 0, void 0, function* () {
    var token = jsonwebtoken_1.default.sign({ user: email + password }, KEY);
    return token;
});
const userRegister = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.body.username == "" || req.body.username == undefined
        && req.body.email == "" || req.body.email == undefined
        && req.body.password == "" || req.body.password == undefined) {
        return res.status(400).json({
            status: false,
            code: 400,
            message: "All Fields are required username,email,password",
        });
    }
    const payload = {
        email: req.body.email,
        password: req.body.password,
        username: req.body.username,
        userType: req.body.userType
    };
    const password = yield genratePassword(payload.password);
    const token = yield createToken({ email: payload.email, password });
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
        const isExist = yield isExistUser({ email: payload.email });
        if (isExist.length > 0) {
            return res.status(400).json({
                status: false,
                code: 400,
                message: "Email Address Already Exist",
            });
        }
        else {
            const user = new user_1.default(payload);
            yield user.save();
            return res.status(200).json({
                status: true,
                code: 200,
                message: "User Register Successfully",
                data: user,
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
exports.userRegister = userRegister;
const login = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.body.email == "" || req.body.email == undefined
        && req.body.password == "" || req.body.password == undefined) {
        return res.status(400).json({
            status: false,
            code: 400,
            message: "All Fields are required email,password",
        });
    }
    const payload = {
        email: req.body.email,
        password: req.body.password
    };
    try {
        const isExist = yield isExistUser({ email: payload.email });
        if (isExist.length > 0) {
            var isTrue = yield comparePassword(payload.password, isExist[0].password);
            if (isTrue == true) {
                if (isExist[0].status) {
                    return res.status(200).json({
                        status: true,
                        code: 200,
                        message: "User Login Successfully",
                        data: isExist[0],
                    });
                }
                else {
                    return res.status(404).json({
                        status: false,
                        code: 404,
                        message: "your account has been suspended, Please contact to admin",
                    });
                }
            }
            else {
                return res.status(404).json({
                    status: false,
                    code: 404,
                    message: "Please Check your email or password",
                });
            }
        }
        else {
            return res.status(404).json({
                status: false,
                code: 404,
                message: "Please Check your email or password",
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
exports.login = login;
const onFetchUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield user_1.default.find({});
        if (users.length > 0) {
            return res.status(200).json({
                status: true,
                code: 200,
                messsage: "All Users Fetch Successfully",
                data: users,
            });
        }
        else {
            return res.status(404).json({
                status: false,
                code: 404,
                message: "Users Not Founded",
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
exports.onFetchUser = onFetchUser;
