import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    items: [{
        menuItem: {type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem'},
        quantity: {type: Number, required: true},
        price: {type: Number}
    }],
    totalPrice: {
        type: Number,
        required: true
    },
    deliveryPartner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    status: {
        type: String,
        enum: ['Delivered', 'Cancelled', 'Pending', 'Accepted', 'Preparing', 'Out for delivery'],
        default: 'Pending'
    },
    deliveryAddress: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
        required: true
    },
    // payment: {
    //     method: {type: String, required: true, enum: ['COD', 'ONLINE']},
    //     status: {type: String, enum: ['Paid', 'Pending', 'Failed', 'Initiated'], default: 'Pending'},
    //     transactionId: String,
    //     amountPaid: {type: Number},
    //     paymentProvider: {type: String, enum: ['Razorpay', 'Stripe', 'PayPal', 'COD'], default: 'COD'},
    //     paidAt: {type: Date}
    // },
    payment: {
        method: {type: String, required: true, enum: ['COD', 'UPI', 'Net-Banking', 'Card'], default: 'COD'},
        status: {type: String, enum: ['Paid', 'Pending', 'Failed'], default: 'Paid'},
        transactionId: String
    }

},{timestamps: true})

orderSchema.index({ customer: 1, createdAt: -1 })
orderSchema.index({ restaurant: 1, createdAt: -1 })

export const Order = mongoose.model('Order', orderSchema)