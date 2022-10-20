import { join } from "path"
import { DynamoDB, S3 } from "aws-sdk"
import { getPreBucketName, TABLE_NAME, TABLE_PK } from "../constants"
const serverless = require('serverless-http')
const express = require("express")
const app = express()

const s3Client = new S3()
const dynamoDbClient = new DynamoDB()
app.use(express.json({ limit: '500mb' }))
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

const staticPath = join(__dirname, "public")
app.use("/static" ,express.static(staticPath))

app.post("/try",async(req:any, res:any)=>{
    try{
        const buckets = await s3Client.listBuckets().promise()
        res.json({ message:"worked !", buckets: buckets.Buckets })
    }
    catch(er){
        console.log(er)
        res.json({ message:"error !", error: er })
    }
})



app.post("/upload", async (req:any, res:any)=>{
    try{
        const base64 = req?.body?.file
        const key = req?.body?.key
        console.log(req.body)
        if(!(key && base64)){
            return res.status(400).json({message:"key missing",})
        }
        console.log(base64, key)
        // upload to pre bucket
        const object = await s3Client.upload({
            Bucket:getPreBucketName(), 
            Key: key,
            Body: Buffer.from(base64.replace(/^data:.+;base64,/, ""), 'base64'),
            ACL: 'public-read',
            ContentEncoding: 'base64',
            ContentType: base64.split(';')[0].split(':')[1]
        }).promise()
          

        const objectUrl = await s3Client.getSignedUrlPromise('getObject', {
            Bucket: getPreBucketName(), 
            Key: (req?.body?.key),
            Expires: 0
        })
        
        const putItemInputparams = {
            Item:DynamoDB.Converter.marshall({objectUrl, [TABLE_PK]:req.body.key }),
            TableName:TABLE_NAME,
            ReturnConsumedCapacity: "TOTAL"
        }

        const dbOutput = await dynamoDbClient.putItem(putItemInputparams).promise()
        console.log(dbOutput)
        res.json({ message:"worked !", details: { ...object, objectUrl} })
    }
    catch(er){
        console.log(er)
        res.json({message:"errored from node runtime !", error: er })
    }
})


export const handler = serverless(app)

