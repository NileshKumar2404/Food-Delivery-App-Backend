import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middlewares.js"
import {upload} from "../middlewares/multer.middleware.js"
import { deleteRestaurant, getAllRestaurants, getFeaturedRestaurants, getMyRestaurant, getRestaurantById, getTopRatedRestaurants, updateRestaurant } from "../controllers/restaurant.controller.js";


const router = Router()

router.route("/get-all-restaurants").get(verifyJWT, getAllRestaurants)
router.route("/get-restaurant/:restaurantId").get(verifyJWT, getRestaurantById)
router.route("/get-my-restaurants").get(verifyJWT, getMyRestaurant)
router.route("/update-restaurant/:restaurantId").patch(verifyJWT, upload.single("image"), updateRestaurant)
router.route("/delete-restaurant/:restaurantId").delete(verifyJWT, deleteRestaurant)
router.route("/get-featured-restaurants").get(verifyJWT, getFeaturedRestaurants)
router.route("/get-toprated-restaurants").get(verifyJWT, getTopRatedRestaurants)
export default router