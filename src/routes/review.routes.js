import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middlewares.js"
import { addReview, adminModeration, deleteReview, getReviewForMenuItem, getReviewForRestaurant, updateReview } from "../controllers/review.controller.js";

const router = Router()

router.route("/add-review").post(verifyJWT, addReview)
router.route("/get-review-restaurant/:restaurantId").get(verifyJWT, getReviewForRestaurant)
router.route("/get-review-menuItem/:menuItemId").get(verifyJWT, getReviewForMenuItem)
router.route("/update-review/:reviewId").patch(verifyJWT, updateReview)
router.route("/delete-review/:reviewId").delete(verifyJWT, deleteReview)
router.route("/admin-moderation/:reviewId").post(verifyJWT, adminModeration)

export default router