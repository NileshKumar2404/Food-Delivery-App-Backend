import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middlewares.js"
import { addAddress, deleteAddress, getUserAddresses, setDefaultAddress, updateAddress } from "../controllers/address.controller.js";

const router = Router()

router.route("/add-address").post(verifyJWT, addAddress)
router.route("/getUserAddress").get(verifyJWT, getUserAddresses)
router.route("/update-address/:addressId").patch(verifyJWT, updateAddress)
router.route("/delete-address/:addressId").delete(verifyJWT, deleteAddress)
router.route("/set-default-address/:addressId").post(verifyJWT, setDefaultAddress)

export default router