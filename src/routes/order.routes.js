import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middlewares.js"
import { assignDeliveryPartner, getAllOrders, getMyOrders, getRestaurantOrders, placeOrder, updateOrderStatus } from "../controllers/order.controller.js";

const router = Router()

router.route("/place-order").post(verifyJWT, placeOrder)
router.route("/get-my-orders").get(verifyJWT, getMyOrders)
router.route("/get-restaurant-orders/:restaurantId").get(verifyJWT, getRestaurantOrders)
router.route("/update-order-status/:orderId").patch(verifyJWT, updateOrderStatus)
router.route("/assign-partner/:orderId/:deliveryPartnerId").post(verifyJWT, assignDeliveryPartner)
router.route("/get-all-orders").get(verifyJWT, getAllOrders)

export default router