import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    owner: {
        type: String,
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
    cuisine: [{
        type: String,
        required: true,
        enum: ['Chinese', 'Italian', 'Indian', 'Japanese', 'French', 'Thai']
    }],
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
    },
    featured: {
        type: Boolean,
        default: false
    }
},{timestamps: true})

export const Restaurant = mongoose.model('Restaurant', restaurantSchema)