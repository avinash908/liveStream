"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postRouter = void 0;
const express_1 = require("express");
const post_1 = require("../controller/post");
const postRouter = (0, express_1.Router)();
exports.postRouter = postRouter;
postRouter.post("/create", post_1.createPost);
postRouter.get("/:id", post_1.getAllPosts);
postRouter.delete("/delete/:id", post_1.deletePost);
postRouter.get("/states/:id/:stateId", post_1.getAllPostsByStates);
postRouter.get("/city/:id/:stateId:/cityId", post_1.getAllPostsByCity);
postRouter.get("/area/:id/:stateId:/cityId/:areaId", post_1.getAllPostsByCity);
postRouter.get("/category/:id", post_1.getAllPostsByCategory);
postRouter.get("/sub-category/:id/:subcategoryId", post_1.getAllPostsBySubCategory);
postRouter.get("/country-and-category/:countryId/:categoryId", post_1.getAllPostByCountryAndCategory);
postRouter.get("/country/:countryId/state/:stateId/category/:categoryId", post_1.getAllPostByCountryStateAndCategory);
postRouter.get("/country/:countryId/state/:stateId/city/:cityId/category/:categoryId", post_1.getAllPostByCountryStateCityAndCategory);
postRouter.get("/country/:countryId/state/:stateId/city/:cityId/area/:areaId/category/:categoryId", post_1.getAllPostByCountryStateCityAreaAndCategory);
