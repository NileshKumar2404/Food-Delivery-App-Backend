import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Restaurant } from "../models/restaurant.models.js"
import { uploadOnCloudinary } from "../utils/Cloudinary.js"
import mongoose from "mongoose"

const getAllRestaurants = asyncHandler(async (req, res) => {
    try {
        let { page = 1, limit = 10, cuisine, search, minRating } = req.query
    
        page = parseInt(page)
        limit = parseInt(limit)
        const skip = (page - 1) * limit;
    
        const matchStage = {}
        if(cuisine) {
            matchStage.cuisine = cuisine
        }
        if(search) {
            matchStage.name = { $regex: search, $options: "i" }
        }
        if(minRating) {
            matchStage.rating = { $gte: parseFloat(minRating) }
        }
    
        const result = await Restaurant.aggregate([
            {
                $match: matchStage
            },
            {
                $facet: {
                    data: [
                        { $sort: { createdAt: -1 } },
                        { $skip: skip },
                        { $limit: limit },
                        {
                            $lookup: {
                                from: 'menuitems',
                                localField: 'menu',
                                foreignField: '_id',
                                as: 'menu'
                            }
                        },
                        {
                            $project: {
                                name: 1,
                                description: 1,
                                cuisine: 1,
                                rating: 1,
                                image: 1,
                                isOpen: 1,
                                createdAt: 1,
                                "menu._id": 1,
                                "menu.name": 1,
                                "menu.description": 1,
                                "menu.price": 1,
                                "menu.image": 1,
                                "menu.ratings": 1
                            }
                        }
                    ],
                    totalCount: [{ $count: "count" }]
                }
            }
        ])
    
        const restaurants = result[0].data
        const totalRestaurants = result[0].totalCount.length > 0 ? result[0].totalCount[0].count : 0
        const totalPages = Math.ceil(totalRestaurants/limit)
    
        return res
        .status(201)
        .json(new ApiResponse(
            201,
            {totalPages, totalRestaurants, restaurants, limit, page},
            "Restaurants fetched successfully."
        ))
    } catch (error) {
        console.error("Error fetching restaurants:", error.message);
        throw new ApiError(500, "Failed to fetch restaurants");
    }
})

const getRestaurantById = asyncHandler(async (req, res) => {
    try {
        const {restaurantId} = req.params
    
        const restaurant = await Restaurant.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(restaurantId)
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'owner',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            {
                $lookup: {
                    from: 'addresses',
                    localField: 'address',
                    foreignField: '_id',
                    as: 'addressDetails'
                }
            },
            {
                $lookup: {
                    from: 'menuitems',
                    localField: 'menu',
                    foreignField: '_id',
                    as: 'menuDetails'
                }
            },
            {
                $project: {
                    name: 1,
                    'addressDetails': 1,
                    description: 1,
                    cuisine: 1,
                    ratings: 1,
                    image: 1,
                    'menuDetails': 1,
                    isOpen: 1
                }
            }
        ])
    
        return res
        .status(201)
        .json(new ApiResponse(
            201,
            {restaurant},
            "All restaurants are fetched successfully."
        ))
    } catch (error) {
        console.error("Error fetching restaurants:", error.message);
        throw new ApiError(500, "Failed to fetch restaurants");
    }
})

const getMyRestaurant = asyncHandler(async (req, res) => {
    const myRestaurant = await Restaurant.find({owner: req.user._id})

    return res
    .status(201)
    .json(new ApiResponse(
        201,
        {myRestaurant},
        "All restaurants are fetched successfully."
    )) 
})

const updateRestaurant = asyncHandler(async (req, res) => {
    try {
        const { restaurantId } = req.params
        const { name, description, cuisine, isOpen } = req.body
        const image = req.file
    
        if(req.user.role === 'customer' || req.user.role === 'delivery') throw new ApiError(403, "You are not authorized to do this");
    
        const imageLocalPath = image?.path
    
        const upload = await uploadOnCloudinary(imageLocalPath)
        console.log(upload.url);
        
        const updatedRestaurant = await Restaurant.findByIdAndUpdate(
            restaurantId,
            {
                name, description, cuisine, isOpen, image: upload.url
            },
            {new: true}
        )
    
        return res
        .status(201)
        .json( new ApiResponse(
            201,
            {updatedRestaurant},
            "Restaurant updated successfully."
        ))
    } catch (error) {
        console.error("Error in update restaurants:", error.message);
        throw new ApiError(500, "Failed to update restaurants");
    }
})

const deleteRestaurant = asyncHandler(async (req, res) => {
    try {
        const { restaurantId } = req.params

        if(req.user.role === 'customer' || req.user.role === 'delivery') throw new ApiError(403, "You are not authorized to do this");

        await Restaurant.findByIdAndDelete(restaurantId)

        return res
        .status(201)
        .json(new ApiResponse(
            201,
            {},
            "Restaurant deleted successfully."
        ))
    } catch (error) {
        console.error("Error to delete restaurants:", error.message);
        throw new ApiError(500, "Failed to delete restaurants");
    }
})

const getFeaturedRestaurants = asyncHandler(async (req, res) => {
    const featuredRestaurants = await Restaurant.find({featured: true})
    .limit(10)
    .select("name cuisine ratings address image")
    if (!featuredRestaurants) throw new ApiError(404, "No featured restaurants are found");

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {featuredRestaurants},
        "Featured restaurants fetched successfully."
    ))
})

const getTopRatedRestaurants = asyncHandler(async (req, res) => {
    const topRatedRestaurants = await Restaurant.find()
    .sort({ratings: -1})
    .limit(10)
    .select("name cuisine address ratings image")
    .populate({
        path: 'address',
        select: 'street city',
        options: {$limit: 1} 
    })

    if (topRatedRestaurants.length === 0) {
        throw new ApiError(404, "No restaurants found");
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {topRatedRestaurants},
        "Top rated restaurants fetched successfully"
    ))
})

export {
    getAllRestaurants,
    getRestaurantById,
    getMyRestaurant,
    updateRestaurant,
    deleteRestaurant,
    getFeaturedRestaurants,
    getTopRatedRestaurants
}