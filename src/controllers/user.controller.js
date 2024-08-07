
import {ApiError} from "../utils/ApiError.js"
import { AsyncHandler } from "../utils/AsyncHandler.js";
import {User} from "../models/User.model.js"
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

const existedUser =  User.findOne({
  $or:[{username}, {email}]
})
if(existedUser){
  throw new ApiError(409, "user already exixts ")
}

})

export { registerUser}