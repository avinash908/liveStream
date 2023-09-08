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
exports.getAllCountry = exports.addCountry = void 0;
const country_1 = __importDefault(require("../model/country"));
const addCountry = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.body.country == "" || req.body.country == undefined &&
        req.body.city == "" || req.body.city == undefined &&
        req.body.state == "" || req.body.state == undefined &&
        req.body.zipCode == "" || req.body.zipCode == undefined &&
        req.body.address == "" || req.body.address == undefined) {
        return res.status(400).json({
            status: false,
            code: 400,
            messsage: "Pass All Required Perameter country,city,state,zip Code,address",
        });
    }
    const payload = {
        country: req.body.country,
        city: req.body.city,
        state: req.body.state,
        zipCode: req.body.zipCode,
        status: req.body.status && true,
        address: req.body.address
    };
    try {
        const country = new country_1.default(payload);
        yield country.save();
        return res.status(200).json({
            status: true,
            code: 200,
            message: "Add Country Success",
            data: country
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
exports.addCountry = addCountry;
const getAllCountry = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const country = yield country_1.default.find({});
        if (country.length > 0) {
            return res.status(200).json({
                status: true,
                code: 200,
                message: "All Country Fetch Success",
                data: country
            });
        }
        else {
            return res.status(404).json({
                status: false,
                code: 404,
                messsage: "Country Not Founded",
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
exports.getAllCountry = getAllCountry;
