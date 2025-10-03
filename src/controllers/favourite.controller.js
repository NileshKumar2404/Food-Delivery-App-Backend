import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { Restaurant } from "../models/restaurant.models.js";
import { MenuItem } from "../models/menuItem.models.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const addFavouriteRestaurant = asyncHandler(async (req, res) => {
    try {
        const {restaurantId} = req.params
    
        if (req.user.role !== "customer") {
            throw new ApiError(401, "Only customers can make favourites.")
        }

        const restaurant = await Restaurant.findOne({_id: restaurantId})
        if (!restaurant) throw new ApiError(403, "Restaurant not found");
    
        const addInFavourite = await User.findByIdAndUpdate(
            req.user._id,
            {
                $addToSet: { favouriteRestaurants: restaurantId }
            },
            {new: true}
        )
    
        return res
        .status(200)
        .json(new ApiResponse(
            200, 
            {addInFavourite},
            "Restaurant added in favourite"
        ))
    } catch (error) {
        console.log(error.message || "Internal server error");
        throw new ApiError(401, "Failed to add restaurant in favourite")
    }
})

export const addFavouriteMenuItem = asyncHandler(async (req, res) => {
    try {
        const {menuItemId} = req.params

        if (req.user.role !== "customer") {
            throw new ApiError(401, "Only customer can make favourites.")
        }
    
        const menuItem = await MenuItem.findOne({_id: menuItemId})
        if (!menuItem) throw new ApiError(403, "Menuitem not found");
    
        const addInFavourite = await User.findByIdAndUpdate(
            req.user._id,
            {
                $addToSet: { favouriteMenuItem: menuItemId }
            },
            {new: true}
        ).select("-refreshToken")
    
        return res
        .status(200)
        .json(new ApiResponse(
            200, 
            {addInFavourite},
            "Menuitem added in favourite"
        ))
    } catch (error) {
        console.log(error.message || "Internal server error");
        throw new ApiError(401, "Failed to add menuitem in favourite")
    }
})

export const removeFromFavourite = asyncHandler(async (req, res) => {
    try {
        const {menuItemId} = req.params
        const {restaurantId} = req.params

        if (req.user.role !== "customer") {
            throw new ApiError(401, "Only customer can remove favourites.")
        }

        if (menuItemId) {
            const menuItem = await User.findByIdAndUpdate(
                req.user._id,
                {
                    $pull: { favouriteMenuItem: menuItemId }
                },
                {new: true}
            ).select("-refreshToken -password")

            if (!menuItem) throw new ApiError(404, "menuItem not found");

            return res
            .status(200)
            .json(new ApiResponse(
                200,
                {menuItem},
                "Menuitem removed"
            ))
        } else if (restaurantId) {
            const restaurant = await User.findByIdAndUpdate(
                req.user._id,
                {
                    $pull: { favouriteRestaurants: restaurantId }
                },
                {new: true}
            ).select("-refreshToken -password")

            if (!restaurant) throw new ApiError(404, "restaurant not found");

            return res
            .status(200)
            .json(new ApiResponse(
                200,
                {restaurant},
                "Restaurant removed"
            ))
        } else {
            throw new ApiError(401, "No ID provided");
        }
    } catch (error) {
        console.log(error.message || "Internal server error");
        throw new ApiError(401, "Failed to remove from favourite")
    }
})

export const getFavourites = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
        if (!user) throw new ApiError(403, "User not found");
    
        const favouriteRestaurantIds = user.favouriteRestaurants || []
        const favouriteMenuItemIds = user.favouriteMenuItem || []
    
        const favouriteRestaurants = await Restaurant.find(
            {_id: {$in: favouriteRestaurantIds}}
        ).populate("address", "street city")
    
        const favouriteMenuItems = await MenuItem.find({
            _id: { $in: favouriteMenuItemIds }
        }).populate("restaurant")
    
        return res
        .status(200)
        .json(new ApiResponse(
            200,
            {favouriteRestaurants, favouriteMenuItems},
            "Favourites are fetched successfully"
        ))
    } catch (error) {
        console.log(error.message || "Internal server error");
        throw new ApiError(401, "Failed to fetch favourites")
    }
})