import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { Address } from "../models/address.models.js"

const addAddress = asyncHandler(async (req, res) => {
    try {
        const {label, street, city, state, pinCode, coordinates} = req.body
    
        if(!street || !city || !state || !pinCode) throw new ApiError(401, "These fields are required");
    
        const user = req.user?._id
        if(!user) throw new ApiError(401, "User not found.");
    
        const createAddress = await Address.create({
            user,
            label,
            street,
            city,
            state,
            pinCode,
            coordinates
        })
    
        return res
        .status(201)
        .json(new ApiResponse(
            201,
            {createAddress},
            "Address added successfully."
        ))
    } catch (error) {
        console.error("Failed to add address: ", error.message);
        throw new ApiError(401, "Failed to add address")
    }
})

const getUserAddresses = asyncHandler(async (req, res) => {
    const addresses = await Address.aggregate([
        {
            $match: {
                user: req.user._id
            }
        },
        {
            $project: {
                label: 1,
                street: 1,
                city: 1,
                state: 1,
                pinCode: 1,
                coordinates: 1
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        }
    ])

    return res
    .status(201)
    .json(new ApiResponse(
        201, 
        {addresses},
        "Addresses fetched successfully."
    ))
})

const updateAddress = asyncHandler(async (req, res) => {
    try {
        const {label, street, city, state, pinCode, coordinates} = req.body
        const{addressId} = req.params
    
        const address = await Address.findOneAndUpdate(
            {_id: addressId, user: req.user._id},
            {
                $set: {
                    label,
                    street,
                    city,
                    state,
                    pinCode,
                    coordinates
                }
            },
            {new: true}
        )
        if (!address) throw new ApiError(403, "Unauthorized action");

        return res
        .status(201)
        .json(new ApiResponse(
            201,
            {address},
            "Address updated successfully"
        ))
    } catch (error) {
        console.error("Failed to update address: ", error.message);
        throw new ApiError(401, "Failed to update address")
    }
})

const deleteAddress = asyncHandler(async (req, res) => {
    const { addressId } = req.params

    const address = await Address.findOne({_id: addressId, user: req.user._id})
    if(!address) throw new ApiError(403, "Unauthorized action");

    await Address.findByIdAndDelete(addressId)

    return res
    .status(201)
    .json(new ApiResponse(
        201, 
        {},
        "Address deleted successfully."
    ))
})

const setDefaultAddress = asyncHandler(async (req, res) => {
    try {
        const {addressId} = req.params
        const userId = req.user._id
    
        const address = await Address.findOne({_id: addressId, user: userId})
        if(!address) throw new ApiError(401, "Address not found or unauthorized");
    
        await Address.updateMany({user: userId}, {$set: {isDefault: false}})
        
        address.isDefault = true
        await address.save()
    
        return res
        .status(201)
        .json(new ApiResponse(
            201,
            {address},
            "Default address set succesfully."
        ))
    } catch (error) {
        console.error("Failed to add default address: ", error.message);
        throw new ApiError(401, "Failed to add default address")
    }
})

export {
    addAddress,
    getUserAddresses,
    updateAddress,
    deleteAddress,
    setDefaultAddress
}