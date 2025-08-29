import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middlewares.js"
import { searchMenuItems, searchRestaurants } from "../controllers/search.controller.js";

const router = Router()

router.route("/search-restaurant").post(verifyJWT, searchRestaurants)
router.route("/search-menu").post(verifyJWT, searchMenuItems)

export default router