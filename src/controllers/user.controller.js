
import {ApiError} from "../utils/ApiError.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";
import {User} from "../models/User.model.js";
import  {uploadOnCloudinary} from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiReponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndGenerateTokens  = async (userId)=>{
  try {
   const user =  await User.findById(userId)
   const accessToken = user.generateAccessToken()
   const refreshToken = user.generateRefreshToken()
   user.refreshToken = refreshToken
   await user.save({validateBeforeSave: false })
    return {accessToken, refreshToken}

  } catch (error) {
    throw new ApiError(500, "Something went wring while gerenrating access and refresh token ")
    
  }
}
const registerUser = AsyncHandler( async (req, res )=>{
 // get users details from from end 
 //validation - not empty 
 //check if ueser already exist : check username , email 
 // check images , check for avatar 
 //upload them to cloudinary , avatar 
 // create user object - create entry in db 
 //remove passwrd refresh token feild  from response 
 // check for user creation  
 //return res
 const {fullname, email, username, password} = req.body
 console.log("email" , email);
  
 if([fullname, email, username, password].some((feild)=>
feild?.trim()==="")){
  throw new ApiError(400, "all feilds are required ")
}

const existedUser = await User.findOne({
  $or:[{username}, {email}]
})
if(existedUser){
  throw new ApiError(409, "user already exixts ")
}
//console.log(req.files);

const avatarLocalPath = req.files?.avatar?.[0]?.path;
//const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
let coverImageLocalPath;
if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
  coverImageLocalPath = req.files.coverImage[0].path
}

 if (!avatarLocalPath)
{
  throw new ApiError(400,"Avatar file is required ");
} 
const avatar = await uploadOnCloudinary(avatarLocalPath);
 const coverImage =  await uploadOnCloudinary(coverImageLocalPath);

 if(!avatar){
  throw new ApiError(400, "avatar file is required ");
 }
   const user = await User.create({
  fullname ,
  avatar: avatar.url,
  coverImage:coverImage?.url  || "",
  email,
  password, 
  username: username.toLowerCase()
 })
 const createdUser = await User.findById(user._id).select(
  "-password -refreshToken" 
 )
 if(!createdUser){
  throw new ApiError(500, "Something  went wrong while registering user ")
 }
  
 return res.status(201).json(
  new ApiResponse(200, createdUser, "User registered successfully ")
 )

 
})
const loginUser = AsyncHandler( async (req, res)=>{
  //req body  -> data
  //username or  email
  //find the user  
  //password check 
  //access and refresh token 
  //send cookie 
  const {email, username, password} = req.body 
  if(!username || !email){
    throw new ApiError(400, "username or Email  is required ")
  }
   const user = await User.findOne({
    $or: [{username}, {email}]
  })
  if(!user){
    throw new ApiError(404,"User dosenot exist ")
  }
  const  isPasswordValid = await user.isPasswordCorrect(password)
  if(!isPasswordValid){
    throw new ApiError(401, "Invaid uer credentials ")
   }
   const {accessToken, refreshToken} = await  generateAccessAndGenerateTokens(user._id)
   const loggedInUser = await User.findById(user._id).select("-password -refreshToken ")
   
   const options  = {
    httpOnly : true ,
    secure:true 
   }
   return res
   .status(200)
   .cookie("accessToken ", accessToken, options)
   .cookie("refreshToken ", refreshToken, options)
   .json(
    new ApiResponse(200, 
      {
        user : loggedInUser, accessToken, refreshToken
      },
      "User logged in successfully "
    )
   )
   

  })
  const  logoutUser = AsyncHandler(async(req, res )=>{
    await User.findByIdAndUpdate(
      req.user._id,{
        $set : {
          refreshToken : undefined
        }
      },
      {
        new: true 
      }
    )
    const options  = {
      httpOnly : true ,
      secure:true 
     }
     return res
     .status(200)
     .clearCookie("accessToken ", options)
     .clearCookie("refreshToken", options)
     .json(new ApiResponse(200, {}, "User logged out "))
    
  })

  const refreshAccessToken = AsyncHandler (async (req, res )=>{
    const incomingRefreshToken = req.cookies.refreshToken   || req.bod.refreshToken
    if(!incomingRefreshToken){
      throw new ApiError(401, "Unauthorized request ")
    }
   try {
     const decodedToken = jwt.verify(
       incomingRefreshToken,
       process.env.REFRESH_TOKEN_SCERET
     )
      const user = await User.findById(decodedToken?._id)
 
      if(!user){
       throw new ApiError(401, "Invalid refresh token ")
     }
 
     if(incomingRefreshToken !==user?.refreshToken){
        
       throw new ApiError(401, "Refresh token is expired or  used  ")
     
     
     }
     
     const options  = {
       httpOnly: true,
       secure: true 
     }
       const {accessToken, newRefreshToken} = await generateAccessAndGenerateTokens(user._id)
 
      return res
      .status(200)
      .cookie("accessToken",accessToken, options )
      .cookie("refreshToken", newRefreshToken, options)
      .json(
       new ApiResponse(
         200,
         {
           accessToken, 
           refreshToken: newRefreshToken
 
         },
         "AccessToken refreshed "
       )
      )
 
   } catch (error) {
    throw new ApiError(401, error?.message  || "Invalid refresh token " )
    
   }

    
  })

  const  chageCurrentUserPassword = AsyncHandler( async (req, res )=>{
    const { oldPassword, newPassword} = req.body
    
   const user = await  User.findById(req.user?._id)

  const isPasswordcorrect =  await user.isPasswordCorrect(oldPassword)
  if(!isPasswordcorrect){
    throw new ApiError(400, "Invalid old password ")
  }

  user.password = newPassword
 await  user.save({validateBeforeSave: false})

 return res.status(200)
 .json(new ApiResponse(
  200,
  {

  },
  "password change successfully "
 ))
  })


  const getCurrentuser = AsyncHandler(async(req, res)=>{
    res.status(200)
    .json(200, req.user, "current user fetched successfully ")
  })

  const updateAccountDetails = AsyncHandler(async(req, res)=>{
    const {fullname, email} = req.body


    if(!fullname || !email ){
      throw new ApiError(400, "All fields are required")
    }
  const user =   User.findByIdAndUpdate( 
      req.user?._id,
    {
      $set: {
        fullname,
        email: email
      }
    },
  {new: true}).select("-password")

  return res.status(200)
  .json(new ApiResponse(200, user, "Account details updated succcessfully "))
  })

  const  updateUserAvatar = AsyncHandler(async(req, res)=>{
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
      throw new ApiError(400, "Avatar file is missing ")

    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
      throw  new ApiError(400, "Error while uploading avatar")
    }
     const user =  await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          avatar: avatar.url
        }
      },
      {
        new: true
      }

    ).select("-password")
    return res
    .status(200)
    .json(
      new ApiResponse(200, user, "avatar  udatead successfully ")
    )
  })
  const  updateCoverImage = AsyncHandler(async(req, res)=>{
    const coverLocalPath = req.file?.path

    if(!coverLocalPath){
      throw new ApiError(400, "coverImage  file is missing ")

    }
    const coverimage = await uploadOnCloudinary(coverLocalPath)
    if(!coverimage.url){
      throw  new ApiError(400, "Error while uploading the image  ")
    }
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          coverimage: coverimage.url
        }
      },
      {
        new: true
      }

    ).select("-password")

    return res
    .status(200)
    .json(
      new ApiResponse(200, user, "Cover image udatead successfully ")
    )
  })


  const getUserChannelProfile = AsyncHandler(async(req, res)=>{
     const { username}= req.params
     if(!username?.trim()){
      throw new ApiError(400, "username is missing ")

     }
     const channel = await User.aggregate([
      {
        $match :{
          username : username?.toLowerCase()
        }
      },
      {
        $lookup :{
          from : "subscription",
          localField: "_id",
          foreignField: "channel",
          as : "subscribers"
        }
      },{
        $lookup : {
          from : "subscription",
          localField: "_id",
          foreignField: "subscriber",
          as : "subscribedTo "

        }
      },
      {
        $addFields: {
          subscribersCount: {
            $size:  "$subscribers"
          },
          channelsSubscribedToCount:{
            $size: "$subscribedTo "
          },
          isSubscribed: {
            $cond:{
              if: {$in: [req.user?._id, "$subscribers.subscriber"]},
              then: true,
              else: false
            }
          }
          

        }
      },
      {
        $project: {
          fullname: 1,
          username: 1,
          subscribersCount: 1,
          channelsSubscribedToCount: 1,
          isSubscribed: 1,
          avatar: 1,
          coverImage: 1,
          email: 1
        }
      }
     
     ])
     if(!channel?.length){
      throw new ApiError(400, "channel dosenot exists ")
      

     }
     return res 
     .status(200)
     .json(
      new ApiResponse(200, channel[0], "user channel fetched successfully ")
     )

  })

  const getWatchHistory  = AsyncHandler(async(req, res)=>{
      const user = await User.aggregate([{
        $match : {
          _id : new mongoose.Types.ObjectId(req.user._id)
        }

      },
      {
        $lookup: {
          from: "videos",
          localField: "watchHistory",
          foreignField: "_id",
          as: "watchHistory ",
          pipeline: [
            {
              $lookup: {
                from: "user",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [{
                  $project: {
                    fullname: 1,
                    avatar: 1,
                    username: 1
                  }

                }
              ]
              }
            },
            {
              $addFields:{
                owner: {
                  $first : "$owner"
                }
              }
            }
          ]
        }
      }
    ])

    return res 
    .status(200)
    .json(new ApiResponse(200, user[0].watchHistory, " watch history fetched successfully "))

  })


  
export {
  registerUser, 
  loginUser, logoutUser, 
  refreshAccessToken ,
  chageCurrentUserPassword,
  getCurrentuser,
  updateAccountDetails ,
  updateUserAvatar,
  updateCoverImage,
  getUserChannelProfile,
  getWatchHistory
}