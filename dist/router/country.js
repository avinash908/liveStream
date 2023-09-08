"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.countryRouter = void 0;
const express_1 = require("express");
const country_1 = require("../controller/country");
const countryRouter = (0, express_1.Router)();
exports.countryRouter = countryRouter;
countryRouter.get('/', country_1.getAllCountry);
countryRouter.post('/create', country_1.addCountry);
