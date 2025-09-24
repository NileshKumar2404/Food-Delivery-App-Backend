import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { Address } from "../models/address.models.js"

const addAddress = asyncHandler(async (req, res) => {
    try {
        const {name, phone, label, street, city, state, pinCode, coordinates} = req.body || {}
    
        if(!street || !city || !state || !pinCode) throw new ApiError(401, "These fields are required");
    
        const user = req.user?._id
        if(!user) throw new ApiError(401, "User not found.");
    
        const coords = coordinates && coordinates.lat && coordinates.long
            ? coordinates
            : { lat: null, long: null }


        const createAddress = await Address.create({
            user,
            name: name || req.user.name,
            phone: phone || req.user.phone,
            label,
            street,
            city,
            state,
            pinCode,
            coordinates: coords
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
    if (req.user.role !== 'customer') {
        return res
        .status(403)
        .json(new ApiResponse(403, {}, "You are not authorize to access customer address"))
    }

    const addresses = await Address.aggregate([
        {
            $match: {
                user: req.user._id
            }
        },
        {
            $project: {
                label: 1,
                name: 1,
                phone: 1,
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
        addresses,
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