import mongoose from "mongoose";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['customer', 'vendor', 'admin', 'delivery'],
        default: 'customer'
    },
    profilePic: {
        type: String,
    },
    refreshToken: {
        type: String,
    },
    vehicleDetails: {
        vehicleName: String,
        vehicleNumber: String
    },
    favouriteRestaurants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant'
    }],
    favouriteMenuItem: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem'
    }]
},{timestamps: true})

userSchema.pre('save', async function(next) {
    if(!this.isModified("password")) return next()
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = async function () {
    console.log("Access token expiry: ", process.env.ACCESS_TOKEN_EXPIRY);
    
    return jwt.sign(
        {
            _id: this._id,
            name: this.name,
            email: this.email,
            phone: this.phone,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = async function () {
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model('User', userSchema)