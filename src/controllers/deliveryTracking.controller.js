import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Order } from "../models/order.models.js"
import { DeliveryTracking } from "../models/deliveryTracking.models.js"

const updateDeliveryLocation = asyncHandler(async (req, res) => {
    try {
        const { orderId, latitude, longitude } = req.body

        if ( !orderId || latitude === undefined || longitude === undefined) throw new ApiError(403, "All these fields are required");

        const order = await Order.findById(orderId)
        if (!order) throw new ApiError(403, "Order not found");

        if (req.user.role !== 'delivery') throw new ApiError(403, "You are not authorized to do this.");

        if (!order.deliveryPartner || order.deliveryPartner.toString() !== req.user._id.toString()) throw new ApiError(403, "You are not assign to this order");

        let deliveryTracking = await DeliveryTracking.findOne({order: orderId})

        if (deliveryTracking) {
            deliveryTracking.locationUpdates.push({lat: latitude, long: longitude, timestamps: new Date()})
            await deliveryTracking.save()
        }else {
            deliveryTracking = await DeliveryTracking.create({
                order: orderId,
                deliveryPartner: req.user._id,
                locationUpdates: [{lat: latitude, long: longitude, timestamps: new Date()}]
            })
        }

        return res
        .status(201)
        .json(new ApiResponse(
            201,
            {deliveryTracking},
            "Delivery location updated or created succesfully`"
        ))
    } catch (error) {
        console.error("Error in updating delivery location:", error.message);
        throw new ApiError(500, "Failed to update delivery location");
    }
})

const getDeliveryLocation = asyncHandler(async (req, res) => {
    const { orderId } = req.params

    const order = await Order.findById(orderId)
    if(!order) throw new ApiError(403, "Order not found");

    if (req.user.role === "customer") {
        if(req.user._id.toString() !== order.customer.toString()) {
            throw new ApiError(403, "You are not authorized to view this order's location");
        }
    }

    if (req.user.role === "delivery") {
        if(!order.deliveryPartner || req.user._id.toString() !== order.deliveryPartner.toString()) {
            throw new ApiError(403, "You are not assigned to this order");
        }
    }

    if (req.user.role === "vendor") {
        throw new ApiError(403, "Vendors are not allowed to see delivery location");
    }

    const tracking = await DeliveryTracking.findOne({order: orderId})
    if (!tracking || tracking.locationUpdates.length === 0) {
        throw new ApiError(403, "No delivery location updates available for this order");
    }

    const latestLocation = tracking.locationUpdates[tracking.locationUpdates.length - 1]

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {latestLocation},
            "Delivery location fetched succesfully`"
        ))
})

const getActiveDeliveries = asyncHandler(async (req, res) => {
    try {
        if (req.user.role !== "delivery") throw new ApiError(403, "Only delivery partners can view active deliveries");
    
        const activeOrders = await Order.find({
            deliveryPartner: req.user._id,
            status: {$ne: 'Delivered'}
        })
    
        if (!activeOrders || activeOrders.length === 0) throw new ApiError(403, "No active deliveries are found.");
    
        const deliveriesWithLocation = await Promise.all(
            activeOrders.map(async (order) => {
                const tracking = await DeliveryTracking.findOne({order: order._id})
                let latestLocation = null
    
                if (tracking && tracking.locationUpdates.length > 0) {
                    latestLocation = tracking.locationUpdates[tracking.locationUpdates.length - 1]
                }
    
                return {
                    order: order._id,
                    status: order.status,
                    customer: order.customer,
                    restaurant: order.restaurant,
                    latestLocation
                }
            })
        )
    
        return res
        .status(200)
        .json(new ApiResponse(
            200,
            deliveriesWithLocation,
            "Delivery location fetched successfully."
        ))
    } catch (error) {
        console.error("Error in fetching active deliveries:", error.message);
        throw new ApiError(500, "Failed to fetch active deliveries.");
    }
})

export {
    updateDeliveryLocation,
    getDeliveryLocation,
    getActiveDeliveries
}