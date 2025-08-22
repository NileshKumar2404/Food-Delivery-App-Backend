import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middlewares.js"
import {upload} from "../middlewares/multer.middleware.js"
import { addMenuItem, deleteMenuItem, getMenuItemsByRestaurant, updateMenuItem } from "../controllers/menuItem.controller.js";

const router = Router()

router.route("/add-menuItem/:restaurantId").post(verifyJWT, upload.single('image'), addMenuItem)
router.route("/getMenuItemsByRestaurant/:restaurantId").get(getMenuItemsByRestaurant)
router.route("/update-menuItem/:restaurantId/:menuItemId").patch(verifyJWT, upload.single('image'), updateMenuItem)
router.route("/delete-menuItem/:restaurantId/:menuItemId").delete(verifyJWT, deleteMenuItem)


export default router