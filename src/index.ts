import express from 'express'
import  dbConnect  from './db'
import dotenv from 'dotenv'
import { User } from './models/user.models'
import bcrypt from 'bcrypt'
import { ApiError } from './utlis/ApiError'
import { ApiResponse } from './utlis/ApiResponse'
import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { authMiddleware } from './middlewares/auth.middleware'


dotenv.config({
    path: './.env'
})

const app = express()

app.use(express.json());

app.post("/api/v1/signup", async(req: Request, res: Response): Promise<any> =>  {
    const {email, username, password} = req.body

    if(
        [username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "required fields can't be empty")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser)
        throw new ApiError(409, "User with this email and username already exists")

    const hashedPassword = await bcrypt.hash(password, 10)


    const newUser = await User.create({
        email,
        username,
        password: hashedPassword
    })

    const createdUser = await User.findById(newUser._id).select("-password")

    if(!createdUser) 
        throw new ApiError(500,  "Something went wrong while registering the user")

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully")
    )

})

app.post("/api/v1/signin", async (req: Request, res: Response): Promise<any> => {
    const {email, username, password} = req.body

    const existedUser = await User.findOne({
        $or: [{email}, {username}]
    })

    if(!existedUser)
        throw new ApiError(404, "User doesn't exists with these credentials")

    const isMatch = await bcrypt.compare(password, existedUser.password);
    if (!isMatch) {
        throw new ApiError(401, "Invalid credentials");
    }

    const token = jwt.sign(
        { 
            id: existedUser._id 
        },
        process.env.JWT_PASSWORD as string,
        { 
            expiresIn: process.env.JWT_EXPIRY ? parseInt(process.env.JWT_EXPIRY, 10) : undefined 
        }
    )

    return res.status(200).json(
        new ApiResponse(201, token, "User logged in Successfully")
    )
    
})

app.post("/api/v1/content", authMiddleware,  (req, res) => {
    const {link, type} = req.body

})

app.get("/api/v1/content",(req, res) => {

})

app.delete("/api/v1/content",(req, res) => {

})

app.post("/api/v1/brain/share",(req, res) => {

})

app.get("/api/v1/brain/share", (req, res) => {
    
})

const port = process.env.PORT || 5000

app.listen(port, () => {
    console.log(`Server Started at Port: ${port}`);
})

dbConnect()