import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middlewares.js"
import { getActiveDeliveries, getDeliveryLocation, updateDeliveryLocation } from "../controllers/deliveryTracking.controller.js";

const router = Router()

router.route("/update-delivery-location").post(verifyJWT, updateDeliveryLocation)
router.route("/get-delivery-location/:orderId").get(verifyJWT, getDeliveryLocation)
router.route("/get-active-deliveries").get(verifyJWT, getActiveDeliveries)


export default router