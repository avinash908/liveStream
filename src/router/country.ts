



import { Router } from "express";
import { addCountry, getAllCountry } from "../controller/country";


const countryRouter = Router();

countryRouter.get('/',getAllCountry);
countryRouter.post('/create',addCountry);



export { countryRouter };
