import mongoose from "mongoose";

const deliveryTrackingSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    deliveryPartner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    locationUpdates: [{
        lat: Number,
        long: Number,
        timestamps: {type: Date, default: Date.now}
    }]
},{timestamps: true})

export const DeliveryTracking = mongoose.model('DeliveryTracking', deliveryTrackingSchema)