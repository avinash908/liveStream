import { Request, Response, Router } from 'express';
import { userRouter } from './user';
import { countryRouter } from './country';
import { categoryRouter } from './category';

const mainRouter: Router = Router();

mainRouter.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        status: false,
        code: 200,
        message: "Live Stream Server is Running..."
    });
});

mainRouter.use("/users", userRouter);
mainRouter.use("/countries", countryRouter);
mainRouter.use("/category", categoryRouter);




export { mainRouter };