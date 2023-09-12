"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postRouter = void 0;
const express_1 = require("express");
const post_1 = require("../controller/post");
const postRouter = (0, express_1.Router)();
exports.postRouter = postRouter;
postRouter.post("/create", post_1.createPost);
postRouter.get("/", post_1.getAllPosts);
