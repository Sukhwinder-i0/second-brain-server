import { Request, NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

export const authMiddleware = (
    req: Request, 
    res: Response, 
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: "Authorization header is missing" });
    }

    const token = authHeader.split(" ")[1];

    const jwtSecret = process.env.JWT_PASSWORD;
    if (!jwtSecret) {
        return res.status(500).json({ message: "JWT secret is not configured" });
    }

    try {
        const decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload;

        if (decoded && decoded._id) {
            (req as any).userId = decoded._id;
            next();
        } else {
            return res.status(401).json({ message: "Invalid token payload" });
        }
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};
