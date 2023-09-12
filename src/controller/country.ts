import { Request, Response } from "express";
import { Area, City, Country, State } from "../model/country"
import { AreaType, CityType, CountryType, StateType } from "../interface/country";





export const addCountry = async (req: Request, res: Response, next: () => void) => {
    if (req.body.country == "" || req.body.country == undefined) {
        return res.status(400).json({
            status: false,
            code: 400,
            messsage: "Pass All Required Perameter country,status",
        });
    }
    const payload: CountryType = {
        country: req.body.country,
        status: req.body.status && true,
    }
    try {
        const country = new Country(payload);
        await country.save();
        return res.status(200).json({
            status: true,
            code: 200,
            message: "Add Country Success",
            data: country
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
export const addState = async (req: Request, res: Response, next: () => void) => {
    if (req.body.countryId == "" || req.body.countryId == undefined
        && req.body.state == "" || req.body.state == undefined
    ) {
        return res.status(400).json({
            status: false,
            code: 400,
            messsage: "Pass All Required Perameter countryId,state,status",
        });
    }
    const payload: StateType = {
        countryId: req.body.countryId,
        state: req.body.state,
        status: req.body.status && true,
    }
    try {
        const state = new State(payload);
        await state.save();
        return res.status(200).json({
            status: true,
            code: 200,
            message: "Add State Success",
            data: state
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
export const addCity = async (req: Request, res: Response, next: () => void) => {
    if (req.body.countryId == "" || req.body.countryId == undefined
        && req.body.stateId == "" || req.body.stateId == undefined
        && req.body.city == "" || req.body.city == undefined

    ) {
        return res.status(400).json({
            status: false,
            code: 400,
            messsage: "Pass All Required Perameter country,state,city,status",
        });
    }
    const payload: CityType = {
        countryId: req.body.countryId,
        stateId: req.body.stateId,
        city: req.body.city,
        status: req.body.status && true,
    }
    try {
        const city = new City(payload);
        await city.save();
        return res.status(200).json({
            status: true,
            code: 200,
            message: "Add City Success",
            data: city
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
export const addArea = async (req: Request, res: Response, next: () => void) => {
    if (req.body.countryId == "" || req.body.countryId == undefined
        && req.body.stateId == "" || req.body.stateId == undefined
        && req.body.cityId == "" || req.body.cityId == undefined
        && req.body.area == "" || req.body.area == undefined


    ) {
        return res.status(400).json({
            status: false,
            code: 400,
            messsage: "Pass All Required Perameter country,state,city,area,status",
        });
    }
    const payload: AreaType = {
        countryId: req.body.countryId,
        stateId: req.body.stateId,
        cityId: req.body.cityId,
        area: req.body.area,
        status: req.body.status && true,
    }
    try {
        const area = new Area(payload);
        await area.save();
        return res.status(200).json({
            status: true,
            code: 200,
            message: "Add Area Success",
            data: area
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
export const getAllCountry = async (req: Request, res: Response, next: () => void) => {
    try {
        const country = await Country.find({}).populate({
            path: "state",
            populate:{
                path:"city",
                populate:{
                    path:'area'
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
        } else {
            return res.status(404).json({
                status: false,
                code: 404,
                message: "Country Not Founded",
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

export const getAllStates = async (req: Request, res: Response, next: () => void) => {
    try {
        const state = await State.find({});
        if (state.length > 0) {
            return res.status(200).json({
                status: true,
                code: 200,
                message: "All State Fetch Success",
                data: state
            });
        } else {
            return res.status(404).json({
                status: false,
                code: 404,
                message: "State Not Founded",
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


export const getAllCites = async (req: Request, res: Response, next: () => void) => {
    try {
        const city = await City.find({});
        if (city.length > 0) {
            return res.status(200).json({
                status: true,
                code: 200,
                message: "All Cites Fetch Success",
                data: city
            });
        } else {
            return res.status(404).json({
                status: false,
                code: 404,
                message: "Cites Not Founded",
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
export const getAllArea = async (req: Request, res: Response, next: () => void) => {
    try {
        const area = await Area.find({});
        if (area.length > 0) {
            return res.status(200).json({
                status: true,
                code: 200,
                message: "All Area Fetch Success",
                data: area
            });
        } else {
            return res.status(404).json({
                status: false,
                code: 404,
                message: "Area Not Founded",
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