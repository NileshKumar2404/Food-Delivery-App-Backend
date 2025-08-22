import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middlewares.js"
import {upload} from "../middlewares/multer.middleware.js"
import { deleteRestaurant, getAllRestaurants, getMyRestaurant, getRestaurantById, updateRestaurant } from "../controllers/restaurant.controller.js";


const router = Router()

router.route("/get-all-restaurants").get(verifyJWT, getAllRestaurants)
router.route("/get-restaurant/:restaurantId").get(verifyJWT, getRestaurantById)
router.route("/get-my-restaurant").get(verifyJWT, getMyRestaurant)
router.route("/update-restaurant/:restaurantId").patch(verifyJWT, upload.single("image"), updateRestaurant)
router.route("/delete-restaurant/:restaurantId").delete(verifyJWT, deleteRestaurant)

export default router