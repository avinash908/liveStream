import { Router } from "express";
import { createPost, getAllPosts,getProductByCountry } from "../controller/post";

const postRouter = Router();



postRouter.post("/create", createPost);
postRouter.get("/", getAllPosts);
postRouter.get("/searchByCountry", getProductByCountry)


export { postRouter };
