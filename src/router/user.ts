import { Router } from "express";
import { login, userRegister,onFetchUser } from "../controller/user";

const userRouter = Router();

userRouter.post("/create-user", userRegister);
userRouter.post("/login-user", login);
userRouter.get('/',onFetchUser)




export { userRouter };
