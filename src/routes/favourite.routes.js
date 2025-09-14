import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middlewares.js"
import { addFavouriteMenuItem, addFavouriteRestaurant, getFavourites, removeFromFavourite } from "../controllers/favourite.controller.js";

const router = Router()

router.route("/add-favourite-restaurant/:restaurantId").post(verifyJWT, addFavouriteRestaurant)
router.route("/add-favourite-menuItem/:menuItemId").post(verifyJWT, addFavouriteMenuItem)
router
    .route("/remove-favourite-restaurant/:restaurantId")
    .delete(verifyJWT, removeFromFavourite);
router
    .route("/remove-favourite-menuItem/:menuItemId")
    .delete(verifyJWT, removeFromFavourite);

router.route("/get-favourites").get(verifyJWT, getFavourites)

export default router