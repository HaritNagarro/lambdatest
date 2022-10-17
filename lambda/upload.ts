import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { join } from "path"
import { S3 } from "aws-sdk"
const multer = require('multer')
const serverless = require('serverless-http')
const express = require("express")
const app = express()

const s3Client = new S3()

const staticPath = join(__dirname, "public")
app.use("/static" ,express.static(staticPath))


app.post("/try",async(req:any, res:any)=>{
    try{
        const buckets = await s3Client.listBuckets().promise()
        res.json({ message:"worked !" ,buckets: buckets.Buckets})
    }
    catch(er){
        res.json({
            message:"error !",
            error: er
        })
    }
})


app.post("/upload", multer().single('file'),(req:any, res:any)=>{
    try{
        console.log("Find file here")
        console.log(req?.file)
        // upload to pre bucket 
        res.json({message:"worked !",files: "req.file"})
    }
    catch(er){
        res.json({message:"worked !", error: er })
    }
})


export const handler = serverless(app)

