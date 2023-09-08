import mongoose from 'mongoose';


const subcategory = new mongoose.Schema(
    {
        "categoryId": {
            "type": mongoose.Schema.Types.ObjectId, ref: 'category'
        },
        "title": {
            "type": "String"
        },
        "description": {
            "type": "String"
        },
        "status": {
            "type": "Boolean"
        }
    }
)

const SubCategory = mongoose.model("subcategory", subcategory);
export default SubCategory;