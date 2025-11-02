import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.models.js"
import { Restaurant } from "../models/restaurant.models.js"
import jwt from 'jsonwebtoken'
import { uploadOnCloudinary } from "../utils/Cloudinary.js"
import { Address } from "../models/address.models.js"

const generateAccessTokenAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(401, "Failed to generate access token and refresh token.")
    }
}

//Common for all roles
const registerUser = asyncHandler(async ( req, res ) => {
    try {
        const {name, email, phone, password} = req.body
    
        if (!name || !email || !password || !phone) {
            throw new ApiError(
                401, 
                "All fields are required"
            )
        }
    
        const existedUser = await User.findOne({email})
        if (existedUser) {
            return res
            .status(401)
            .json(new ApiResponse(
                401,
                {},
                "User already registered!!"
            ))
        }
    
        const newUser = await User.create({
            name,
            email,
            phone, 
            password
        })
    
        const {accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(newUser._id)
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const createdUser = await User.findById(newUser._id).select("-password -refreshToken")
    
        return res
        .status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(
            201,
            {createdUser, accessToken, refreshToken},
            "User registered successfully"
        ))
    } catch (error) {
        console.error("Failed to register: ", error.message);
        throw new ApiError(401, "Failed to register user")
    }
})

const loginUser = asyncHandler(async ( req, res ) => {
    try {
        const {email, password} = req.body
    
        if(!email || !password) throw new ApiError(401, "All fields are required");
    
        const user = await User.findOne({email})
        if(!user) {
            return res
            .status(401)
            .json(new ApiResponse(
                401,
                {},
                "User not existed!!"
            ))
        }
    
        const checkPass = await user.isPasswordCorrect(password)
        if(!checkPass) {
            return res
            .status(401)
            .json(new ApiResponse(
                401,
                {},
                "Wrong password!!"
            ))
        }
    
        const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    
        const {accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(user._id)
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(
            200,
            {loggedInUser, accessToken, refreshToken},
            "User logged in successfully"
        ))
    } catch (error) {
        console.error("Failed to login: ", error.message);
        throw new ApiError(401, "Failed to login user")
    }
})

const logoutUser = asyncHandler(async ( req, res ) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $unset: {
                    refreshToken: ""
                }
            },
            {new: true}
        )

        if(!user) throw new ApiError(401, "User not found");

        return res
        .status(201)
        .json(new ApiResponse(
            201,
            {},
            "User log out successfully."
        ))
    } catch (error) {
        throw new ApiError(401, "Failed to logout user")
        console.error("Failed to logout: ", error.message);
    }
})

const refreshAccessToken = asyncHandler(async ( req, res ) => {
    try {
        const incomingRefreshToken = req.body?.refreshToken || req.cookies.refreshToken
        console.log("Incoming token: ", incomingRefreshToken);
        

        if(!incomingRefreshToken) throw new ApiError(401, "Unauthorized access");

        console.log("---- REFRESH TOKEN DEBUG ----");
        console.log("Incoming token:", req.body.refreshToken || req.cookies.refreshToken);
        console.log("Cookies:", req.cookies);
        console.log("Body:", req.body);
        console.log("-----------------------------");

    
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        console.log("Decoded refresh token: ", decodedToken);
        
    
        const user = await User.findById(decodedToken?._id)
        if(!user) throw new ApiError(401, "Refresh token expired");
    
        if(incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token expired or used")
        }
    
        const {accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(user._id)
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res
        .status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(
            201,
            {accessToken, refreshToken},
            "Access token refreshed."
        ))
    } catch (error) {
        console.error("Failed to refresh access token: ", error.message);
        throw new ApiError(401, "Failed to refresh access token")
    }
})

const changePassword = asyncHandler(async ( req, res ) => {
    try {
        const {oldPass, newPass} = req.body
    
        if(!oldPass || !newPass) throw new ApiError(401, "All fields are required.");
    
        const user = await User.findById(req.user._id)

        const comparePass = await user.isPasswordCorrect(oldPass)
        if(!comparePass) throw new ApiError(401, "Incorrect old password.");
    
        user.password = newPass
        await user.save()
    
        return res
        .status(201)
        .json(new ApiResponse(
            201,
            {},
            "Password updated successfully."
        ))
    } catch (error) {
        console.error("Failed to update password: ", error.message);
        throw new ApiError(401, "Failed to update password")
    }
})

const updateProfile = asyncHandler(async ( req, res ) => {
    try {
        const {name, phone, vehicleDetails} = req.body
    
        const user = await User.findById(req.user._id)
        if(!user) throw new ApiError(401, "User not found.");

        if(name) user.name = name;
        if(phone) user.phone = phone;

        if(req.user.role === "delivery" && vehicleDetails) {
            user.vehicleDetails = vehicleDetails
        }

        await user.save()

        const updatedUser = await User.findById(user._id).select("-password -refreshToken")
    
        return res
        .status(200)
        .json(new ApiResponse(
            200,
            {updatedUser},
            "Customer details updated successfully."
        ))
    } catch (error) {
        console.error("Failed to update customer details: ", error.message)
        throw new ApiError(401, "Failed to update customer details")
    }
})

//Customer Functions
const getCustomerProfile = asyncHandler(async ( req, res ) => {
    try {
        const user = await User.findById(req.user._id).select("-password -refreshToken")
        if(!user) throw new ApiError(404, "User not found.");
    
        return res
        .status(200)
        .json(new ApiResponse(
            200,
            {user},
            "Customer profile fetched successfully."
        ))
    } catch (error) {
        throw new ApiError(401, "Failed to get customer profile")
        console.error("Failed to get customer profile: ", error.message);
    }
})

//Admin Functions
const createVendor = asyncHandler(async ( req, res ) => {
    try {
        const {name, email, phone, password} = req.body
    
        if (!name || !email || !password || !phone) {
            throw new ApiError(
                401, 
                "All fields are required"
            )
        }
        
        const existedUser = await User.findOne({email})
        if (existedUser) {
            return res
            .status(401)
            .json(new ApiResponse(
                401,
                {},
                "Vendor already registered!!"
            ))
        }
    
        const newVendor = await User.create({
            name,
            email,
            phone, 
            password,
            role: 'vendor'
        })

        const {accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(newVendor._id)
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const createdVendor = await User.findById(newVendor._id).select("-password -refreshToken")
    
        return res
        .status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(
            201,
            {createdVendor, accessToken, refreshToken},
            "Vendor created successfully"
        ))
    } catch (error) {
        throw new ApiError(401, "Failed to create vendor")
        console.error("Failed to create vendor: ", error.message);
    }
})

const createRestaurant = asyncHandler(async ( req, res ) => {
    try {
        const {restaurantName, description, cuisine, street, city, state, pinCode, featured} = req.body
    
        if(!restaurantName || !description || !cuisine || !street || !city || !pinCode || !state) throw new ApiError(401, "All fields are required.");
    
        const image = req.file
        if(!image) throw new ApiError(401, "Image is required");
    
        const imageLocalPath = image.path
        if(!imageLocalPath) throw new ApiError(401, "Local file path is required");
    
        const upload = await uploadOnCloudinary(imageLocalPath)
        if(!upload.url) throw new ApiError(401, "Failed to upload image on cloudinary");
    
        const onwerId = req.user._id
        console.log(onwerId);
        
        if(req.user.role !== 'vendor') throw new ApiError(401, "Only vendor can create restaurant.");

        const newAddress = await Address.create({
            street,
            city,
            state,
            pinCode,
            user: onwerId
        })
    
        const newRestaurant = await Restaurant.create({
            name: restaurantName,
            owner: onwerId,
            address: newAddress._id,
            description: description,
            cuisine: cuisine,
            image: upload.url,
            featured: featured
        })
    
        return res
        .status(201)
        .json(new ApiResponse(
            201, 
            {newRestaurant},
            "Restaurant created successfully."
        ))
    } catch (error) {
        console.error("Failed to create restaurant: ", error.message);
        throw new ApiError(500, "Failed to create restaurant");
    }
})

const createDeliveryPartner = asyncHandler(async ( req, res ) => {
    try {
        const {name, email, phone, password, vehicleDetails} = req.body
    
        if (!name || !email || !password || !phone || !vehicleDetails) throw new ApiError(401, "All fields are required")
        
        const existedUser = await User.findOne({email})
        if (existedUser) {
            return res
            .status(401)
            .json(new ApiResponse(
                401,
                {},
                "Delivery partner already registered!!"
            ))
        }
    
        const newDeliveryPartner = await User.create({
            name,
            email,
            phone, 
            password,
            role: 'delivery',
            vehicleDetails: vehicleDetails
        })

        const {accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(newDeliveryPartner._id)
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const createDeliveryPartner = await User.findById(newDeliveryPartner._id).select("-password -refreshToken")
    
        return res
        .status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(
            201,
            {createDeliveryPartner, accessToken, refreshToken},
            "Vendor created successfully"
        ))
    } catch (error) {
        console.error("Failed to create delivery partner: ", error.message);
        throw new ApiError(401, "Failed to create delivery partner")
    }
})

const getAllUsers = asyncHandler(async ( req, res ) => {
    try {
        const {role} = req.params
        let {page = 1, limit = 10} = req.query
    
        page = parseInt(page)
        limit = parseInt(limit)
        const skip = (page - 1) * limit
    
        const matchStage = {}
        if(role) {
            matchStage.role = role
        }
    
        const getUser = await User.aggregate([
            {
                $match: matchStage
            },
            {
                $facet: {
                    data: [
                        {$sort: {createdAt: -1}},
                        {$skip: skip},
                        {$limit: limit},
                        {
                            $project: {
                                name: 1,
                                phone: 1,
                                email: 1,
                                role: 1,
                                createdAt: 1
                            }
                        }
                    ],
                    totalCount: [
                        {$count: "count"}
                    ]
                }
            }
        ])
    
        const userList = getUser[0].data
        const totalUsers = getUser[0].totalCount.length > 0? getUser[0].totalCount[0].count : 0
        const totalPage = Math.ceil(totalUsers/limit)
    
        return res
        .status(201)
        .json(new ApiResponse(
            201, 
            {getUser: userList, page, limit, totalUsers, totalPage},
            "User fetched successfully"
        ))
    } catch (error) {
        console.error("Error fetching users:", error.message);
        throw new ApiError(500, "Failed to fetch users");
    }
})

const deleteUser = asyncHandler(async ( req, res ) => {
    try {
        const {userId} = req.params

        const user = await User.findOneAndDelete(userId)
        if(!user) throw new ApiError(401, "User not found.")
        
        return res
        .status(201)
        .json(new ApiResponse(
            201,
            {},
            "User deleted successfully."
        ))
    } catch (error) {
        console.error("Error deleting users:", error.message);
        throw new ApiError(500, "Failed to delete users");
    }
})

const getVendorProfile = asyncHandler(async ( req, res ) => {
    try {
        const vendor = await User.findById(req.user._id).select("-password -refreshToken")
        if(!vendor) throw new ApiError(401, "Vendor not found");
    
        if (vendor.role !== "vendor") {
            throw new ApiError(403, "Forbidden: user is not a vendor.")
        }
    
        return res
        .status(201)
        .json(new ApiResponse(
            201,
            { vendor },
            "Vendor profile fetched successfully."
        ))
    } catch (error) {
        console.error("Error fetching vendor profile:", error.message);
        throw new ApiError(500, "Failed to fetch vendor profile");
    }
})

const getDeliveryProfile = asyncHandler(async ( req, res ) => {
    try {
        const deliveryPartner = await User.findById(req.user._id).select("-password -refreshToken")
        if(!deliveryPartner) throw new ApiError(401, "Delivery Partner not found");
    
        if (deliveryPartner.role !== "delivery") {
            throw new ApiError(403, "Forbidden: user is not a delivery partner.")
        }
    
        return res
        .status(201)
        .json(new ApiResponse(
            201,
            { deliveryPartner },
            "delivery profile fetched successfully."
        ))
    } catch (error) {
        console.error("Error fetching delivery profile:", error.message);
        throw new ApiError(500, "Failed to fetch delivery profile");
    }
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCustomerProfile,
    updateProfile,
    changePassword,
    createVendor,
    createRestaurant,
    createDeliveryPartner,
    getAllUsers,
    deleteUser,
    getVendorProfile,
    getDeliveryProfile,
}