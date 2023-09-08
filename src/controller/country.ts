import { Request, Response } from "express";
import Country from "../model/country"
import { CountryType } from "../interface/country";





export const addCountry = async (req: Request, res: Response, next: () => void) => {
    if (req.body.country == "" || req.body.country == undefined &&
        req.body.city == "" || req.body.city == undefined &&
        req.body.state == "" || req.body.state == undefined &&
        req.body.zipCode == "" || req.body.zipCode == undefined &&
        req.body.address == "" || req.body.address == undefined
    ) {
        return res.status(400).json({
            status: false,
            code: 400,
            messsage: "Pass All Required Perameter country,city,state,zip Code,address",
        });
    }
    const payload: CountryType = {
        country: req.body.country,
        city: req.body.city,
        state: req.body.state,
        zipCode: req.body.zipCode,
        status: req.body.status && true,
        address: req.body.address
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
            messsage: "Server Error",
            error: error
        });
    }
    next();
}
export const getAllCountry = async (req: Request, res: Response, next: () => void) => {
    try {
        const country = await Country.find({});
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
                messsage: "Country Not Founded",
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