import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Cart } from "../models/cart.models.js"
import { User } from "../models/user.models.js"
import { MenuItem } from "../models/menuItem.models.js"

const addToCart = asyncHandler(async (req, res) => {
    try {
        const {quantity, menuItemId} = req.body || {}

        const menu = await MenuItem.findById(menuItemId)
        if(!menu) throw new ApiError(404, "Menuitem not found");

        let cartItem = await Cart.findOne({user: req.user._id, menuItem: menuItemId})

        if (cartItem) {
            cartItem.quantity = quantity
            await cartItem.save()
        } else {
            cartItem = await Cart.create({
                user: req.user._id,
                menuItem: menuItemId,
                quantity
            })
        }

        return res
        .status(201)
        .json(new ApiResponse(
            201, 
            {cartItem},
            "Item added into cart successfully"
        ))
    } catch (error) {
        console.log("Internal server error: ", error);
        throw new ApiError(401, "Failed to add menuitems in cart")
    }
}) 

const getCart = asyncHandler(async (req, res) => {
    if (req.user.role !== 'customer') throw new ApiError(401, "Only customers can access their cart");

    const cartItems = await Cart.find({ user: req.user._id }).populate("menuItem")

    const total = cartItems.reduce((sum, item) => {
        const numericPrice = parseFloat(
            item.menuItem.price.toString().replace(/[^0-9.]/g, "")
        ) || 0

        return sum + numericPrice * item.quantity
    }, 0)

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {cartItems, total},
        "Cart items are fetched successfully."
    ))
})

const removeCartItem = asyncHandler(async (req, res) => {
    const {cartItemId} = req.params

    if (req.user.role !== 'customer') throw new ApiError(401, "Only customers can remove items from their cart");

    const deletedItem = await Cart.findOneAndDelete({user: req.user._id, _id: cartItemId})
    if (!deletedItem) throw new ApiError(404, "Cart items are not found or it is already removed");

    const cart = await Cart.find({user: req.user._id}).populate("menuItem")

    const total = cart.reduce((sum, item) => {
        const numericPrice = parseFloat(
            item.menuItem.price.toString().replace(/[^0-9.]/g, "")
        ) || 0
        return sum + numericPrice * item.quantity
    }, 0)

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {cart, total},
        "Item removed from the cart"
    ))
})

export {
    addToCart,
    getCart,
    removeCartItem
}