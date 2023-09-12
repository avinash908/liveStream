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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllArea = exports.getAllCites = exports.getAllStates = exports.getAllCountry = exports.addArea = exports.addCity = exports.addState = exports.addCountry = void 0;
const country_1 = require("../model/country");
const addCountry = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.body.country == "" || req.body.country == undefined) {
        return res.status(400).json({
            status: false,
            code: 400,
            messsage: "Pass All Required Perameter country,status",
        });
    }
    const payload = {
        country: req.body.country,
        status: req.body.status && true,
    };
    try {
        const country = new country_1.Country(payload);
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
            message: "Server Error",
            error: error
        });
    }
    next();
});
exports.addCountry = addCountry;
const addState = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.body.countryId == "" || req.body.countryId == undefined
        && req.body.state == "" || req.body.state == undefined) {
        return res.status(400).json({
            status: false,
            code: 400,
            messsage: "Pass All Required Perameter countryId,state,status",
        });
    }
    const payload = {
        countryId: req.body.countryId,
        state: req.body.state,
        status: req.body.status && true,
    };
    try {
        const state = new country_1.State(payload);
        yield state.save();
        return res.status(200).json({
            status: true,
            code: 200,
            message: "Add State Success",
            data: state
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
exports.addState = addState;
const addCity = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.body.countryId == "" || req.body.countryId == undefined
        && req.body.stateId == "" || req.body.stateId == undefined
        && req.body.city == "" || req.body.city == undefined) {
        return res.status(400).json({
            status: false,
            code: 400,
            messsage: "Pass All Required Perameter country,state,city,status",
        });
    }
    const payload = {
        countryId: req.body.countryId,
        stateId: req.body.stateId,
        city: req.body.city,
        status: req.body.status && true,
    };
    try {
        const city = new country_1.City(payload);
        yield city.save();
        return res.status(200).json({
            status: true,
            code: 200,
            message: "Add City Success",
            data: city
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
exports.addCity = addCity;
const addArea = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.body.countryId == "" || req.body.countryId == undefined
        && req.body.stateId == "" || req.body.stateId == undefined
        && req.body.cityId == "" || req.body.cityId == undefined
        && req.body.area == "" || req.body.area == undefined) {
        return res.status(400).json({
            status: false,
            code: 400,
            messsage: "Pass All Required Perameter country,state,city,area,status",
        });
    }
    const payload = {
        countryId: req.body.countryId,
        stateId: req.body.stateId,
        cityId: req.body.cityId,
        area: req.body.area,
        status: req.body.status && true,
    };
    try {
        const area = new country_1.Area(payload);
        yield area.save();
        return res.status(200).json({
            status: true,
            code: 200,
            message: "Add Area Success",
            data: area
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
exports.addArea = addArea;
const getAllCountry = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const country = yield country_1.Country.find({}).populate({
            path: "state",
            populate: {
                path: "city",
                populate: {
                    path: 'area'
                }
            }
        });
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
                message: "Country Not Founded",
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
exports.getAllCountry = getAllCountry;
const getAllStates = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const state = yield country_1.State.find({});
        if (state.length > 0) {
            return res.status(200).json({
                status: true,
                code: 200,
                message: "All State Fetch Success",
                data: state
            });
        }
        else {
            return res.status(404).json({
                status: false,
                code: 404,
                message: "State Not Founded",
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
exports.getAllStates = getAllStates;
const getAllCites = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const city = yield country_1.City.find({});
        if (city.length > 0) {
            return res.status(200).json({
                status: true,
                code: 200,
                message: "All Cites Fetch Success",
                data: city
            });
        }
        else {
            return res.status(404).json({
                status: false,
                code: 404,
                message: "Cites Not Founded",
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
exports.getAllCites = getAllCites;
const getAllArea = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const area = yield country_1.Area.find({});
        if (area.length > 0) {
            return res.status(200).json({
                status: true,
                code: 200,
                message: "All Area Fetch Success",
                data: area
            });
        }
        else {
            return res.status(404).json({
                status: false,
                code: 404,
                message: "Area Not Founded",
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
exports.getAllArea = getAllArea;
