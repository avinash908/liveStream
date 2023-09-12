import { Router } from "express";
import { addArea, addCity, addCountry, addState, getAllCountry,getAllStates,getAllCites,getAllArea } from "../controller/country";
const countryRouter = Router();
countryRouter.get('/', getAllCountry);
countryRouter.get('/states', getAllStates);
countryRouter.get("/cites",getAllCites)
countryRouter.get('/area', getAllArea);
countryRouter.post('/create', addCountry);
countryRouter.post('/create-state', addState);
countryRouter.post('/create-city', addCity);
countryRouter.post('/create-area', addArea);
export { countryRouter };
