import { Router } from "express";
import {
    createPost, getAllPosts, getAllPostsByCategory, getAllPostsByCity, getAllPostsByStates, getAllPostsBySubCategory, deletePost, getAllPostByCountryAndCategory, getAllPostByCountryStateAndCategory, getAllPostByCountryStateCityAndCategory, getAllPostByCountryStateCityAreaAndCategory
} from "../controller/post";

const postRouter = Router();



postRouter.post("/create", createPost);
postRouter.get("/:id", getAllPosts);
postRouter.delete("/delete/:id", deletePost);
postRouter.get("/states/:id/:stateId", getAllPostsByStates);
postRouter.get("/city/:id/:stateId:/cityId", getAllPostsByCity);
postRouter.get("/area/:id/:stateId:/cityId/:areaId", getAllPostsByCity);
postRouter.get("/category/:id", getAllPostsByCategory)
postRouter.get("/sub-category/:id/:subcategoryId", getAllPostsBySubCategory)
postRouter.get("/country-and-category/:countryId/:categoryId", getAllPostByCountryAndCategory)
postRouter.get("/country/:countryId/state/:stateId/category/:categoryId", getAllPostByCountryStateAndCategory)
postRouter.get("/country/:countryId/state/:stateId/city/:cityId/category/:categoryId", getAllPostByCountryStateCityAndCategory)
postRouter.get("/country/:countryId/state/:stateId/city/:cityId/area/:areaId/category/:categoryId", getAllPostByCountryStateCityAreaAndCategory)





export { postRouter };
