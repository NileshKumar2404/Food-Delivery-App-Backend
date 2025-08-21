import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middlewares.js"
import {upload} from "../middlewares/multer.middleware.js"
import { changePassword, createDeliveryPartner, createRestaurant, createVendor, deleteUser, getAllUsers, getCustomerProfile, getDeliveryProfile, getVendorProfile, loginUser, logoutUser, refreshAccessToken, registerUser, updateProfile } from "../controllers/user.controller";

const router = Router()

router.route("/register-user").post(registerUser)
router.route("/login-user").post(loginUser)
router.route("/logout-user").post(verifyJWT, logoutUser)
router.route("/refresh-access-token").post(refreshAccessToken)
router.route("/change-password").put(verifyJWT, changePassword)
router.route("/update-profile").patch(verifyJWT, updateProfile)
router.route("/get-customer-profile").get(verifyJWT, getCustomerProfile)
router.route("/create-vendor").post(createVendor)
router.route("/create-restaurant").post(upload.single("image"),createRestaurant)
router.route("/create-deliveryPartner").post(createDeliveryPartner)
router.route("/get-all-users/:role").get(verifyJWT, getAllUsers)
router.route("/delete-user/:userId").delete(verifyJWT, deleteUser)
router.route("/get-vendor-profile").get(verifyJWT, getVendorProfile)
router.route("/get-delivery-profile").get(verifyJWT, getDeliveryProfile)

export default router