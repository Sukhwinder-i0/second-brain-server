import express from "express";
import dbConnect from "./db";
import dotenv from "dotenv";
import { User } from "./models/user.models";
import bcrypt from "bcrypt";
import { ApiError } from "./utlis/ApiError";
import { ApiResponse } from "./utlis/ApiResponse";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { authMiddleware } from "./middlewares/auth.middleware";
import { Content } from "./models/content.models";
import { asyncHandler } from "./utlis/AsyncHandler";
import { ShareLink } from "./models/link.models";
import { generateRandom } from "./utlis/RandomString";
import { Error } from "mongoose";
import cors from "cors";

dotenv.config({
  path: "./.env",
});

const app = express();

app.use(express.json());
app.use(cors())

dbConnect()
  .then(() => {
    app.on("error", () => {
      console.log("ERROR", Error);
      throw Error;
    });

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server is running at Port: ${PORT}`);
    });
  })
  .catch((err: Error) => {
    console.log("MongoDB connection failed !!! ", err);
  });

app.post(
  "/api/v1/signup",
  asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const { email, username, password } = req.body;
    if ([username, password].some((field) => field?.trim() === "")) {
      throw new ApiError(400, "required fields can't be empty");
    }

    const existedUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existedUser)
      throw new ApiError(
        409,
        "User with this email and username already exists"
      );

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      email,
      username,
      password: hashedPassword,
    });

    const createdUser = await User.findById(newUser._id).select("-password");

    if (!createdUser)
      throw new ApiError(
        500,
        "Something went wrong while registering the user"
      );

    return res
      .status(201)
      .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
  })
);

app.post(
  "/api/v1/signin",
  asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const { email, username, password } = req.body;

    const existedUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (!existedUser) {
      if (!existedUser) {
        throw new ApiError(404, "User doesn't exist with these credentials");
      }
    }

    const isMatch = await bcrypt.compare(password, existedUser.password);
    if (!isMatch) {
      throw new ApiError(401, "Invalid credentials");
    }

    const token = jwt.sign(
      {
        id: existedUser._id,
      },
      process.env.JWT_PASSWORD || "defaultSecret",
      {
        expiresIn: process.env.JWT_EXPIRY || "1d",
      } as jwt.SignOptions
    );

    return res
      .status(200)
      .json(new ApiResponse(201, token, "User logged in Successfully"));
  })
);

app.post(
  "/api/v1/content",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { link, type } = req.body;

    try {
      await Content.create({
        link,
        type,
        // @ts-ignore
        userId: req.userId,
        tag: [],
      });

      res.json({
        message: "Content Added",
      });
    } catch (error) {
      console.error("Content can't be added: ", error);
    }
  })
);

app.get(
  "/api/v1/content",
  authMiddleware,
  asyncHandler(async (req, res) => {
    //@ts-ignore
    const userId = req.userId;
    const content = await Content.find({
      userId: userId,
    }).populate("userId", "username");

    res.json({
      content,
    });
  })
);

app.delete(
  "/api/v1/content",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { contentId } = req.body;
    // @ts-ignore
    const userId = req.userId;

    if (!contentId) {
      throw new ApiError(400, "Content ID is required");
    }

    const deletedContent = await Content.deleteOne({
      _id: contentId,
      userId,
    });

    if (deletedContent.deletedCount === 0) {
      throw new ApiError(404, "Content not found or unauthorized");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "Content deleted successfully"));
  })
);

app.post(
  "/api/v1/brain/share",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { share } = req.body;
    try {
      if (share) {
        const  existingLink = await ShareLink.findOne({
          userId: req.userId
        })

        if(existingLink) {
          return res.json({
            hash: existingLink.hash
          })
        }

        const hash = generateRandom(15)
        await ShareLink.create({
          userId: req.userId,
          hash: hash
        });

        res.json({
          hash
        })
        
      } else {
          await ShareLink.deleteMany({
          userId: req.userId,
          share: false,
        });
        return res.json({
          message: "Removed Link"
        })
      }

    } catch (error) {
      throw new ApiError(409, "Couldn't updated shareable link");
    }
  })
);

app.get(
  "/api/v1/brain/:shareLink",
  asyncHandler(async (req, res) => {
    try {
      const hash = req.params.shareLink;

      const link = await ShareLink.findOne({
        hash
      });
      console.log(link)

      if (!link) {
        res.status(409).json({
          message: "incorrect input",
        });
        return;
      }

      const content = await Content.find({
        userId: link.userId,
      });

      const user = await User.findOne({
        _id: link.userId,
      });

      res.json({
        username: user?.username,
        content: content,
      });

    } catch (error) {
      throw new ApiError(409, "something went wrong");
    }
  })
);
