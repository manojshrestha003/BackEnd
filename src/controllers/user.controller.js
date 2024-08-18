
import {ApiError} from "../utils/ApiError.js"
import { AsyncHandler } from "../utils/AsyncHandler.js";
import {User} from "../models/User.model.js"
import  {uploadOnCloudinary} from "../utils/Cloudinary.js"
import { ApiResponse } from "../utils/ApiReponse.js";
import jwt from "jsonwebtoken"

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

  
export { registerUser, loginUser, logoutUser, refreshAccessToken }