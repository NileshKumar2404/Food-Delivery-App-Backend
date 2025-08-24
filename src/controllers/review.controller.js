import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Order } from "../models/order.models.js"
import { Review } from "../models/review.models.js"
import { Restaurant } from "../models/restaurant.models.js"
import { MenuItem } from "../models/menuItem.models.js"
import mongoose from "mongoose"

const addReview = asyncHandler(async (req, res) => {
    try {
        const { menuItemId, ratings, comment, restaurantId } = req.body

        if (!ratings || (!menuItemId && !restaurantId)) throw new ApiError(403, "These fields are required");

        if (req.user.role !== "customer") throw new ApiError(403, "Only customers are allowed to add reviews.");

        if (restaurantId) {
            const order = await Order.findOne({customer: req.user._id, restaurant: restaurantId})
            if (!order) throw new ApiError(403, "You can only review restaurants you have ordered from.");
        }

        const existingReviews = await Review.findOne({customer: req.user._id, restaurant: restaurantId})
        if (existingReviews) throw new ApiError(400, "You are already reviewed this item.")

        const review = await Review.create({
            customer: req.user._id,
            restaurant: restaurantId || null,
            menuItem: menuItemId || null,
            ratings,
            comment,
        })

        if (restaurantId) {
            const result = await Review.aggregate([
                { $match: {restaurant: new mongoose.Types.ObjectId(restaurantId)} },
                { $group: {_id: null, avgRating: {$avg: '$ratings'}} }
            ])
            updateRating = result.length > 0 ? result[0].avgRating : ratings
            await Restaurant.findByIdAndUpdate(restaurantId, {ratings: updateRating})
        }

        if (menuItemId) {
            const result = await Review.aggregate([
                { $match: {menuItem: new mongoose.Types.ObjectId(menuItemId)} },
                { $group: {_id: null, avgRating: {$avg: '$ratings'}} }
            ])
            updateRating = result.length > 0 ? result[0].avgRating : ratings
            await MenuItem.findByIdAndUpdate(menuItemId, {ratings: updateRating})

            return res
            .status(201)
            .json(new ApiResponse(
                201,
                {review, updateRating},
                "Review added successfully."
            ))
        }
    } catch (error) {
        console.error("Error in add review:", error.message);
        throw new ApiError(500, "Failed to add review");
    }
})

const getReviewForRestaurant = asyncHandler(async (req, res) => {
    const { restaurantId } = req.params

    const restaurant = await Review.aggregate([
        {
            $match: { 
                restaurant: restaurantId
            }
        },
        {
            $lookup: {
                from: 'restaurants',
                localField: 'restaurant',
                foreignField: '_id',
                as: 'restaurantDetails'
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'customer',
                foreignField: '_id',
                as: 'customerDetails'
            }
        },
        {
            $project: {
                'customerDetails.name': 1,
                'customerDetails.email': 1,
                'restaurantDetails.name': 1,
                'restaurantDetails.ratings': 1,
                ratings: 1,
                comment: 1
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {restaurant},
        "Restaurant reviews are fetched successfully."
    ))
})

const getReviewForMenuItem = asyncHandler(async (req, res) => {
    const { menuItemId } = req.params

    const menuItem = await Review.aggregate([
        {
            $match: { 
                menuItem: menuItemId
            }
        },
        {
            $lookup: {
                from: 'menuitems',
                localField: 'menuItem',
                foreignField: '_id',
                as: 'menuItemDetails'
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'customer',
                foreignField: '_id',
                as: 'customerDetails'
            }
        },
        {
            $project: {
                'customerDetails.name': 1,
                'customerDetails.email': 1,
                'menuItemDetails.name': 1,
                'menuItemDetails.ratings': 1,
                ratings: 1,
                comment: 1
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {menuItem},
        "Restaurant reviews are fetched successfully."
    ))
})

const updateReview = asyncHandler(async (req, res) => {
    const { reviewId } = req.params
    const { ratings, comment } = req.body

    const review = await Review.findById(reviewId)
    if (!review) throw new ApiError(403, "Review not found");

    if (review.customer.toString() !== req.user._id.toString()) throw new ApiError(403, "You are not a authenticated user to update this review.");

    const updatedReview = await Review.findByIdAndUpdate(
        reviewId,
        {
            $set: {
                ratings: ratings,
                comment: comment
            }
        },
        {new: true}
    )

    let updatedRating = null

    if(review.restaurant) {
        const result = await Review.aggregate([
            { $match: {restaurant: review.restaurant} },
            { $group: {_id: null , avgRating: {$avg: '$ratings'}} }
        ])

        updatedRating = result.length > 0 ? result[0].avgRating: 0
        await Restaurant.findByIdAndUpdate(review.restaurant, {ratings: updatedRating})
    }

    if(review.menuItem) {
        const result = await Review.aggregate([
            { $match: {menuItem: review.menuItem} },
            { $group: {_id: null , avgRating: {$avg: '$ratings'}} }
        ])

        updatedRating = result.length > 0 ? result[0].avgRating: 0
        await MenuItem.findByIdAndUpdate(review.menuItem, {ratings: updatedRating})
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200, 
        {updatedReview, updatedRating},
        "Review updated successfully"
    ))
})

const deleteReview = asyncHandler(async (req, res) => {
    const { reviewId } = req.params

    const review = await Review.findById(reviewId)
    if (!review) throw new ApiError(403, "Review not found"); 

    if (req.user.role === "admin") {
        await Review.findByIdAndDelete(reviewId)
    } else if (req.user.role === 'customer') {
        if (review.customer.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "You are not authorized to delete this review.");
        }
        await Review.findByIdAndDelete(reviewId)
    }else {
        throw new ApiError(403, "Only the admins and review owners can delete the review.");
    }

    let updatedRating = null

    if(review.restaurant) {
        const result = await Review.aggregate([
            { $match: {restaurant: review.restaurant} },
            { $group: {_id: null , avgRating: {$avg: '$ratings'}} }
        ])

        updatedRating = result.length > 0 ? result[0].avgRating: 0
        await Restaurant.findByIdAndUpdate(review.restaurant, {ratings: updatedRating})
    }

    if(review.menuItem) {
        const result = await Review.aggregate([
            { $match: {menuItem: review.menuItem} },
            { $group: {_id: null , avgRating: {$avg: '$ratings'}} }
        ])

        updatedRating = result.length > 0 ? result[0].avgRating: 0
        await MenuItem.findByIdAndUpdate(review.menuItem, {ratings: updatedRating})
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200, 
        {updatedRating},
        "Review deleted successfully"
    ))
})

const adminModeration = asyncHandler(async (req, res) => {
    const { reviewId } = req.params

    const review = await Review.findById(reviewId)
    if (!review) throw new ApiError(403, "Review not found");
    
    if (req.user.role === 'admin') {
        await Review.findByIdAndDelete(reviewId)
    }else {
        throw new ApiError(403, "Only the admins can delete the review.");
    }

    let updatedRating = null

    if(review.restaurant) {
        const result = await Review.aggregate([
            { $match: {restaurant: review.restaurant} },
            { $group: {_id: null , avgRating: {$avg: '$ratings'}} }
        ])

        updatedRating = result.length > 0 ? result[0].avgRating: 0
        await Restaurant.findByIdAndUpdate(review.restaurant, {ratings: updatedRating})
    }

    if(review.menuItem) {
        const result = await Review.aggregate([
            { $match: {menuItem: review.menuItem} },
            { $group: {_id: null , avgRating: {$avg: '$ratings'}} }
        ])

        updatedRating = result.length > 0 ? result[0].avgRating: 0
        await MenuItem.findByIdAndUpdate(review.menuItem, {ratings: updatedRating})
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200, 
        {},
        "Review deleted successfully"
    ))
})

export {
    addReview,
    getReviewForRestaurant,
    getReviewForMenuItem,
    updateReview,
    deleteReview,
    adminModeration
}
