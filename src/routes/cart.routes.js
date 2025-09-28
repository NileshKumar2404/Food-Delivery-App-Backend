import express from 'express'
import { verifyJWT } from "../middlewares/auth.middlewares.js"
import { addToCart, getCart, removeCartItem } from '../controllers/cart.controller.js'

const router = express.Router()

router.route("/add-cart").post(verifyJWT, addToCart)
router.route("/get-cart").get(verifyJWT, getCart)
router.route("/remove-item/:cartItemId").delete(verifyJWT, removeCartItem)

export default router