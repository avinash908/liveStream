import { Router } from "express";
import { createPost, getAllPosts } from "../controller/post";

const postRouter = Router();



postRouter.post("/create", createPost);
postRouter.get("/", getAllPosts);



export { postRouter };
