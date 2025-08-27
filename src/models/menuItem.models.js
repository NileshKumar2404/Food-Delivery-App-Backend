import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: true
    },
    category: String,
    image: {
        type: String,
        required: true
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    ratings: {
        type: Number,
        default: 0
    },
},{timestamps: true})

export const MenuItem = mongoose.model('MenuItem', menuItemSchema)