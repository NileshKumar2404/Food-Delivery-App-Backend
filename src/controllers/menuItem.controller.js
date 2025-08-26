import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { MenuItem } from "../models/menuItem.models.js";
import { Restaurant } from "../models/restaurant.models.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js"

const addMenuItem = asyncHandler(async (req, res) => {
    try {
        const { restaurantId } = req.params
        const { name, price, description, category } = req.body
        const image = req?.file

        if(!image) throw new ApiError(400, "Image is required");
    
        const restaurant = await Restaurant.findById(restaurantId)
    
        if(req.user.role !== 'vendor') throw new ApiError(403, "You are not authorized to do this.");
    
        if(req.user._id.toString() !== restaurant.owner.toString()) throw new ApiError(403, "You are not a owner of this restaurant.");
    
        const imageLocalPath = image?.path
    
        const upload = await uploadOnCloudinary(imageLocalPath)
        console.log(upload.url);
        
        const menuItem = await MenuItem.create({
            name,
            restaurant: restaurantId,
            description,
            price,
            category,
            image: upload.url,
        })
    
        return res
        .status(201)
        .json(new ApiResponse(
            201,
            {menuItem},
            "MenuItem created successfully."
        ))
    } catch (error) {
        console.error("Error creating menuItems:", error.message);
        throw new ApiError(500, "Failed to create menuItems");
    }
})

const getMenuItemsByRestaurant = asyncHandler(async (req, res) => {
    try {
        const { restaurantId } = req.params
        const { category } = req.query

        console.log(category);
        
        const restaurant = await Restaurant.findById(restaurantId)
        if(!restaurant) throw new ApiError(404, "Restaurant not found");

        const filter = { restaurant: restaurantId }
        if(category) {
            filter.category = category
        }

        const menuItems = await MenuItem.find(filter).select("name description price category image isAvailable createdAt")

        return res
        .status(200)
        .json(new ApiResponse(
            200,
            { menuItems },
            "Menu items fetched successfully."
        ))
    } catch (error) {
        console.error("Error fetching restaurants by menuItems:", error.message);
        throw new ApiError(500, "Failed to fetch restaurants by menuItems");
    }
})

const updateMenuItem = asyncHandler(async (req, res) => {
    try {
        const {menuItemId, restaurantId} = req.params
        const {price, description, isAvailable} = req.body
        const image = req?.file
    
        if(!image) throw new ApiError(400, "Image is required");
    
        const restaurant = await Restaurant.findById(restaurantId)
    
        if(req.user.role !== 'vendor') throw new ApiError(403, "You are not authorized to do this.");
    
        if(req.user._id.toString() !== restaurant.owner.toString()) throw new ApiError(403, "You are not a owner of this restaurant.");
    
        const imageLocalPath = image.path
    
        const upload = await uploadOnCloudinary(imageLocalPath)
    
        const updatedMenuItem = await MenuItem.findByIdAndUpdate(
            menuItemId,
            {
                price, description, image: upload.url, isAvailable
            },
            {new: true}
        )
    
        return res
            .status(200)
            .json(new ApiResponse(
                200,
                { updatedMenuItem },
                "Menu items fetched successfully."
            ))
    } catch (error) {
        console.error("Error updating menuItems:", error.message);
        throw new ApiError(500, "Failed to update menuItem");
    }
})

const deleteMenuItem = asyncHandler(async (req, res) => {
    try {
        const { menuItemId, restaurantId } = req.params
    
        const restaurant = await Restaurant.findById(restaurantId)
    
        if(req.user.role !== 'vendor') throw new ApiError(403, "You are not authorized to do this.");
    
        if(req.user._id.toString() !== restaurant.owner.toString()) throw new ApiError(403, "You are not a owner of this restaurant.");
    
        const deletedMenuItem = await MenuItem.findByIdAndDelete(menuItemId);
    
        return res
            .status(200)
            .json(new ApiResponse(
                200,
                { deletedMenuItem },
                "Menu items deleted successfully."
            ))
    } catch (error) {
        console.error("Error deleting menuItems:", error.message);
        throw new ApiError(500, "Failed to delete menuItems");
    }
})

export {
    addMenuItem,
    getMenuItemsByRestaurant,
    updateMenuItem,
    deleteMenuItem
}