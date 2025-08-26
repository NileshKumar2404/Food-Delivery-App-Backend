import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Order } from "../models/order.models.js"
import { Restaurant } from "../models/restaurant.models.js"
import { Address } from "../models/address.models.js"
import { MenuItem } from "../models/menuItem.models.js"
import { User } from "../models/user.models.js"

// const placeOrder = asyncHandler(async (req, res) => {
//     try {
//         const { restaurantId, items, addressId, paymentMethod } = req.body
    
//         if(!items || !restaurantId || items.length === 0 || !addressId || !paymentMethod) {
//             throw new ApiError(400, "All fields are required.")
//         }
    
//         const restaurant = await Restaurant.findById(restaurantId)
//         if(!restaurant) throw new ApiError(404, "Restaurant not found.");
    
//         const address = await Address.findOne({_id: addressId, user: req.user._id})
//         if(!address) throw new ApiError(404, "Invalid delivery address");
    
//         let totalPrice = 0
//         const orderItems = []
    
//         for(const item of items) {
//             const menuItem = await MenuItem.findById(item.menuItem)
//             if(!menuItem) throw new ApiError(404, `Menu item not found: ${item.menuItem}`);
    
//             const itemTotal = menuItem.price * item.quantity
//             totalPrice += itemTotal
    
//             orderItems.push({
//                 menuItem: menuItem._id,
//                 quantity: item.quantity,
//                 price: menuItem.price
//             })
//         }

//         let paymentData = {
//             method: paymentMethod,
//             status: 'Pending'
//         }

//         if (paymentMethod === "COD") {
//             paymentData.status = "Pending" //It will modified after payment recieved
//         }else if (paymentMethod === "ONLINE") {
//             paymentData.status = "Initiated"
//             paymentData.transactionId = `txn_${Date.now()}`  
//         }

    
//         // const order = await Order.create({
//         //     customer: req.user._id,
//         //     restaurant: restaurantId,
//         //     items: orderItems,
//         //     totalPrice,
//         //     status: "Pending",
//         //     deliveryAddress: addressId,
//         //     payment: {
//         //         method: paymentMethod,
//         //         status: 'Pending'
//         //     }
//         // })

//         const order = await Order.create({
//             customer: req.user._id,
//             restaurant: restaurantId,
//             items: orderItems,
//             totalPrice,
//             status: "Pending",
//             deliveryAddress: addressId,
//             payment: paymentData
//         })
    
//         return res
//         .status(201)
//         .json(new ApiResponse(
//             201,
//             {order},
//             "Order placed successfully"
//         ))
//     } catch (error) {
//         console.error("Error to place order:", error.message);
//         throw new ApiError(500, "Failed to place order");
//     }
// })

const placeOrder = asyncHandler(async (req, res) => {
    try {
        const { restaurantId, items, addressId, paymentMethod } = req.body
    
        if(!items || !restaurantId || items.length === 0 || !addressId || !paymentMethod) {
            throw new ApiError(400, "All fields are required.")
        }
    
        const restaurant = await Restaurant.findById(restaurantId)
        if(!restaurant) throw new ApiError(404, "Restaurant not found.");
    
        const address = await Address.findOne({_id: addressId, user: req.user._id})
        if(!address) throw new ApiError(404, "Invalid delivery address");
    
        let totalPrice = 0
        const orderItems = []
    
        for(const item of items) {
            const menuItem = await MenuItem.findById(item.menuItem)
            if(!menuItem) throw new ApiError(404, `Menu item not found: ${item.menuItem}`);
    
            const itemTotal = menuItem.price * item.quantity
            totalPrice += itemTotal
    
            orderItems.push({
                menuItem: menuItem._id,
                quantity: item.quantity,
                price: menuItem.price
            })
        }
    
        const order = await Order.create({
            customer: req.user._id,
            restaurant: restaurantId,
            items: orderItems,
            totalPrice,
            status: "Pending",
            deliveryAddress: addressId,
            payment: {
                method: paymentMethod,
                status: 'Pending'
            }
        })
    
        return res
        .status(201)
        .json(new ApiResponse(
            201,
            {order},
            "Order placed successfully"
        ))
    } catch (error) {
        console.error("Error to place order:", error.message);
        throw new ApiError(500, "Failed to place order");
    }
})

//customer
const getMyOrders = asyncHandler(async (req, res) => {
    const orders = await Order.aggregate([
        {
            $match: {customer: req.user._id}
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
                from: 'menuItems',
                localField: 'items.menuItem',
                foreignField: '_id',
                as: 'menuItemDetails'
            }
        },
        {
            $lookup: {
                from: 'addresses',
                localField: 'deliveryAddress',
                foreignField: '_id',
                as: 'addressDetails'
            }
        },
        {
            $project: {
                'restaurantDetails.name': 1,
                'restaurantDetails.address': 1,
                'restaurantDetails.cuisine': 1,
                'restaurantDetails.ratings': 1,
                'menuItemDetails.name': 1,
                'menuItemDetails.price': 1,
                'menuItemDetails.category': 1,
                totalPrice: 1,
                deliveryAddress: 1,
                payment: 1,
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        }
    ])

    if(!orders) throw new ApiError(404, "No orders found.");

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {orders},
        "Orders fetched successfully."
    ))
})

//vendor
const getRestaurantOrders = asyncHandler(async (req, res) => {
    const {restaurantId} = req.params

    if(req.user.role !== 'vendor') throw new ApiError(404, "You are not authorized to do this.");

    const restaurant = await Restaurant.findOne({_id: restaurantId, owner: req.user._id})
    if(!restaurant) throw new ApiError(404, "This restaurant is not yours.");

    const ordersFromRestaurant = await Order.aggregate([
        {
            $match: {restaurant: restaurantId}
        },
        {
            $lookup: {
                from: 'users',
                localField: 'customer',
                foreignField: '_id',
                as: 'userDetails'
            }
        },
        {
            $lookup: {
                from: 'menuItems',
                localField: 'items.menuItem',
                foreignField: '_id',
                as: 'menuItemDetails'
            }
        },
        {
            $lookup: {
                from: 'addresses',
                localField: 'deliveryAddress',
                foreignField: '_id',
                as: 'addressDetails'
            }
        },
        {
            $project: {
                'userDetails.name': 1,
                'userDetails.phone': 1,
                'menuItemDetails.name': 1,
                'menuItemDetails.price': 1,
                'menuItemDetails.category': 1,
                'addressDetails': 1,
            }
        },
        {
            $sort: {createdAt: -1}
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {ordersFromRestaurant},
        "Orders from restaurant successfully fetched."
    ))
}) 

//vendor/delivery
const updateOrderStatus = asyncHandler(async (req, res) => {
    try {
        const { orderId } = req.params
        const { status } = req.body

        const order = await Order.findById(orderId)
        if(!order) throw new ApiError(404, "Order not found");

        if (req.user.role === 'vendor') {
            const allowed = ['Accepted', 'Preparing', 'Ready for pickup']
            if (!allowed.includes(status)) throw new ApiError(403, "Invalid status for vendor");
            order.status = status
        }
        if (req.user.role === 'delivery') {
            const allowed = ['Delivered', 'Out for delivery']
            if (!allowed.includes(status)) throw new ApiError(403, "Invalid status for delivery partner");
            order.status = status
        }
        if (req.user.role === 'customer') {
            if (status !== 'Cancelled') throw new ApiError(403, "Customer can only cancel orders");
            order.status = status
        }
        if (order.status === "Delivered") {
            order.payment.status = 'Paid'
        }

        await order.save()

        return res
        .status(200)
        .json(new ApiResponse(
            200, 
            {order},
            "Order status updated successfully."
        ))
    } catch (error) {
        console.error("Error in updating order status:", error.message);
        throw new ApiError(500, "Failed to update order status");
    }
}) 

//admin/vendor
const assignDeliveryPartner = asyncHandler(async (req, res) => {
    try {
        const { orderId, deliveryPartnerId } = req.params
    
        if (!orderId || !deliveryPartnerId) throw new ApiError(403, "These fields are required");
    
        if (req.user.role !== "vendor" && req.user.role !== "admin") throw new ApiError(403, "You are not authorized to do this.");
    
        const deliveryPartnerExistence = await User.findOne({_id: deliveryPartnerId, role: 'delivery'})
        if (!deliveryPartnerExistence) throw new ApiError(404, "Delivery partner not existed.");
    
        const updateOrder = await Order.findByIdAndUpdate(
            orderId,
            {
                $set: {
                    deliveryPartner: deliveryPartnerId
                }
            },
            {new: true}
        )
    
        if (!updateOrder) throw new ApiError(404, "Order not found");
    
        return res
        .status(200)
        .json(new ApiResponse(
            200, 
            {updateOrder},
            "Delivery partner assigned successfully."
        ))
    } catch (error) {
        console.error("Error in assigning delivery partner:", error.message);
        throw new ApiError(500, "Failed to assign delivery partner.");
    }
}) 

//admin
const getAllOrders = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') throw new ApiError(403, "Only admins can view all the orders.");

    const { page = 1, limit = 10, status } = req.query
    const skip = (page - 1) * limit

    const matchStage = {}
    if (status) {
        matchStage.status = status
    }

    const orders = await Order.aggregate([
        {
            $match: matchStage
        },
        {
            $lookup: {
                from: 'users',
                localField: 'customer',
                foreignField: '_id',
                as: 'customerDetails'
            }
        },
        { $unwind: '$customerDetails' },
        {
            $lookup: {
                from: 'restaurants',
                localField: 'restaurant',
                foreignField: '_id',
                as: 'restaurantDetails'
            }
        },
        { $unwind: '$restaurantDetails' },
        {
            $lookup: {
                from: 'users',
                localField: 'deliveryPartner',
                foreignField: '_id',
                as: 'deliveryPartnerDetails'
            }
        },
        { $unwind: {path: '$deliveryPartnerDetails', preserveNullAndEmptyArrays: true} },
        {
            $project: {
                'customerDetails.name': 1,
                'customerDetails.email': 1,
                'restaurantDetails.name': 1,
                'restaurantDetails.cuisine': 1,
                'deliveryPartnerDetails.name': 1,
                items: 1,
                totalPrice: 1,
                status: 1,
                payment: 1,
                createdAt: 1
            }
        },
        { $sort: { createdAt:-1 } },
        { $skip: parseInt(skip) },
        { $limit: parseInt(limit) }
    ])

    const totalOrders = await Order.countDocuments(matchStage)

    return res
    .status(200)
    .json(new ApiResponse(
        200, 
        {
            orders,
            pagination: {
                totalOrders,
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalOrders / limit)
            }
        }, 
        "All orders are fetched successfully."
    ))
}) 

export {
    placeOrder,
    getMyOrders,
    getRestaurantOrders,
    updateOrderStatus,
    assignDeliveryPartner,
    getAllOrders
}