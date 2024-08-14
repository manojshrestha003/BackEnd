
import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/Multer.middleware.js";


const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",  // Remove the trailing space
            maxCount: 1
        }
    ]),
    registerUser
);

router.route("/login").post(loginUser)

//secured routes 
router.route("/logout").post(logoutUser)

export default router