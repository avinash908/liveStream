"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbConnect = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = require("dotenv");
// mongodb+srv://avinashjeswani908:<password>@cluster0.da3scfr.mongodb.net/?retryWrites=true&w=majority
(0, dotenv_1.config)();
const URI = process.env.MONGOOSEURI;
const dbConnect = () => __awaiter(void 0, void 0, void 0, function* () {
    yield mongoose_1.default.connect(URI)
        .then(() => console.log('Connected!')).catch((error) => {
        console.log(error);
    });
});
exports.dbConnect = dbConnect;
// "Avinash@@123";
