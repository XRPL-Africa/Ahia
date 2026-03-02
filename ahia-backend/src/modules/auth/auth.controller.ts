import { Request, Response } from "express";
import { registerUser, loginUser } from "./auth.service.js";
import { generateToken } from "../../utils/jwt.js";
import redis from "../../config/redis.js";

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await registerUser(email, password);

    res.status(201).json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await loginUser(email, password);

    const token = generateToken({ userId: user.id });

    // store session in Redis
    await redis.set(`session:${user.id}`, token, "EX", 60 * 60 * 24);

    res.json({ token, user });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};