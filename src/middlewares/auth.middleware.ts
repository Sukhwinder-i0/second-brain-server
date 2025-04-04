import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

declare module "express" {
    interface Request {
        userId?: string;
    }
}

export const authMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ message: "Authorization header missing or malformed" });
        return;
    }

    const token = authHeader.split(" ")[1]; // ✅ extract only the token

    const jwtSecret = process.env.JWT_PASSWORD;

    if (!jwtSecret) {
        res.status(500).json({ message: "JWT secret is not configured" });
        return;
    }

    try {
        const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

        if (!decoded || typeof decoded !== "object" || !decoded.id) {
            res.status(401).json({ message: "Invalid token" });
            return;
        }

        req.userId = decoded.id;
        next();
    } catch (error) {
        console.error("JWT Verification Error:", error);
        res.status(401).json({ message: "Invalid or expired token" });
    }
};
