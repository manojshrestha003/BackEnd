
import { Router } from "express";
import { loginUser,
     logoutUser,
      registerUser,
       refreshAccessToken,
        chageCurrentUserPassword, 
        getCurrentuser, 
        updateAccountDetails,
        updateUserAvatar, 
        updateCoverImage, 
        getUserChannelProfile,
         getWatchHistory } from "../controllers/user.controller.js";
import { upload } from "../middlewares/Multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


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
router.route("/logout").post( verifyJWT, logoutUser)

router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT, chageCurrentUserPassword)

router.route("/current-user").get(verifyJWT, getCurrentuser)

router.route("/update-account").patch(verifyJWT, updateAccountDetails)

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)

router.route("/cover-image").patch(verifyJWT, upload.single("coverimage"), updateCoverImage )

router.route("/c/:username").get(verifyJWT, getUserChannelProfile)

router.route("/history").get(verifyJWT, getWatchHistory)



export default router