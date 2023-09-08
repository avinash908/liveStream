"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mainRouter = void 0;
const express_1 = require("express");
const user_1 = require("./user");
const country_1 = require("./country");
const category_1 = require("./category");
const mainRouter = (0, express_1.Router)();
exports.mainRouter = mainRouter;
mainRouter.get("/", (req, res) => {
    res.status(200).json({
        status: false,
        code: 200,
        message: "Live Stream Server is Running..."
    });
});
mainRouter.use("/users", user_1.userRouter);
mainRouter.use("/countries", country_1.countryRouter);
mainRouter.use("/category", category_1.categoryRouter);
