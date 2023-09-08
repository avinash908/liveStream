import mongoose from 'mongoose';


const category = new mongoose.Schema(
    {
        "title": {
            "type": "String"
        },
        "description": {
            "type": "String"
        },
        "status": {
            "type": "Boolean"
        }
    },
    {
        toJSON: { virtuals: true }
    }
)
category.virtual("subcategory", {
    ref: "subcategory",
    foreignField: "categoryId",
    localField: "_id"
  });
  

const Category = mongoose.model("category", category);
export default Category;