import { v2 as cloudinary} from "cloudinary";
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env. CLUDINARY_CLOUD_NAME, 
    api_key: process.env.CLUDINARY_API_KEY, 
    api_secret: process.env.CLUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath)=>{
    try {
        if(!localFilePath) return null;
        //upload the fileon cloudinsay 
      const response =  await   cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        //file has been uploaded succesfully 
        console.log("File is uploaded  on cloudinary ", response.url)
        return response
        
    } catch (error) {
        fs.unlinkSync(localFilePath) //remove the locally saved temp file as the upload operation got  failed
        return null; 
    }

}
export {uploadOnCloudinary}