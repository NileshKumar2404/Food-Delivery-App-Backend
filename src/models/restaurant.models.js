import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema({
    name: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    owner: {
        name: String,
        required: true
    },
    address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
        required: true
    },
    description: {
        type: String,
        required: true
    },
    cuisine: {
        type: String,
        required: true,
        enum: ['Chinese', 'Italian', 'Indian', 'Japanese', 'French']
    },
    ratings: {
        type: Number,
        default: 0
    },
    image: {
        type: String,
        required: true
    },
    menu: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem'
    }],
    isOpen: {
        type: Boolean,
        default: true
    }
},{timestamps: true})

export const Restaurant = mongoose.model('Restaurant', restaurantSchema)