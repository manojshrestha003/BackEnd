
import {ApiError} from "../utils/ApiError.js"
import { AsyncHandler } from "../utils/AsyncHandler.js";
import {User} from "../models/User.model.js"
import  {uploadOnCloudinary} from "../utils/Cloudinary.js"
import { ApiResponse } from "../utils/ApiReponse.js";
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

export { registerUser}