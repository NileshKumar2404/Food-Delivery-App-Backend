import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Restaurant } from "../models/restaurant.models.js"
import { MenuItem } from "../models/menuItem.models.js"

const searchRestaurants = asyncHandler(async (req, res) => {
    const {query} = req.query
    console.log(query);

    if (!query) throw new ApiError(400, "Search query is required");

    const restaurants = await Restaurant.find({
        $or: [
            {name: {$regex: query, $options: 'i'}},
            {cuisine: {$regex: query, $options: 'i'}},
            {description: {$regex: query, $options: 'i'}},
        ]
    }).select("name cuisine ratings address")

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {restaurants},
        "Restaurant search results."
    ))
})

const searchMenuItems = asyncHandler(async (req, res) => {
    const {query} = req.query

    if (!query) throw new ApiError(400, "Search query is required");

    const menuItem = await MenuItem.find({
        $or: [
            {name: {$regex: query, $options: 'i'}},
            {description: {$regex: query, $options: 'i'}},
            {category: {$regex: query, $options: 'i'}},
        ]
    }).select("name cuisine ratings address")

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {menuItem},
        "Restaurant search results."
    ))
})

export {
    searchMenuItems,
    searchRestaurants
}