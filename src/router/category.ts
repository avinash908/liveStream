import { Router } from "express";
import { addCategory, getAllCategory,addSubCategory, getAllSubCategory ,getMenuTopics} from "../controller/category";


const categoryRouter = Router();
categoryRouter.post('/create', addCategory);
categoryRouter.post('/sub-category-create', addSubCategory);

categoryRouter.get('/menuTopics', getMenuTopics);

categoryRouter.get('/', getAllCategory);
categoryRouter.get('/sub-categroy', getAllSubCategory);






export { categoryRouter };
