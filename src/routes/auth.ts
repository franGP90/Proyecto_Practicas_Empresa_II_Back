import { Router } from "express";
import { getDb } from "../mongo";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { User, JwtPayload } from "../types";
import { AuthRequest, verifyToken } from "../middleware/verifyToken";

const router = Router();

dotenv.config();

const SECRET = process.env.SECRET;

const coleccion = async() => (await getDb()).collection<User>("Users");

router.get("/", async (req, res) => {
    res.send("Se ha conectado a la ruta de auth correctamente");
});

router.post("/register", async (req, res) => {
    try {
        const { email, password, username, preferences } = req.body as {
            email: string;
            password: string;
            username: string;
            preferences?: User["preferences"];
        };

        if (!email || !password || !username) {
            return res.status(400).json({ message: "email, username y password son obligatorios" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
        }

        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Email no válido" });
        }

        const users = await coleccion();

        const exists = await users.findOne({ $or: [{ email }, { username }] });
        if (exists) {
            return res.status(400).json({ message: "Email o nombre de usuario ya existente" });
        }

        const passEncripta = await bcrypt.hash(password, 10);
        const result = await users.insertOne({
            email,
            password: passEncripta,
            username,
            preferences: preferences ?? {},
        });

        res.status(201).json({ message: "Usuario creado correctamente!", id: result.insertedId });
    } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
            res.status(500).json({ message });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body as { email: string; password: string };

        if (!email || !password) {
            return res.status(400).json({ message: "email y password son obligatorios" });
        }

        const users = await coleccion();

        const user = await users.findOne({ email });
        if (!user) return res.status(404).json({ message: "email incorrecto" });

        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(404).json({ message: "contraseña incorrecta" });

        const token = jwt.sign({ id: user._id?.toString(), email: user.email } as JwtPayload, SECRET as string, {
            expiresIn: "1h",
        });

        res.status(200).json({
            message: "Login correcto",
            token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                preferences: user.preferences ?? {},
            },
        });
    } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
  res.status(500).json({ message });
    }
});

router.get("/me", verifyToken, async (req: AuthRequest, res) => {
    try {
        const payload = req.user as JwtPayload;
        const users = await coleccion();

        const user = await users.findOne(
            { _id: new ObjectId(payload.id) },
            { projection: { password: 0 } }
        );

        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

        res.status(200).json(user);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ message });
    }
});

router.put("/preferences", verifyToken, async (req: AuthRequest, res) => {
    try {
        const payload = req.user as JwtPayload;
        const newPreferences = req.body as User["preferences"];

        const users = await coleccion();
        const result = await users.findOneAndUpdate(
            { _id: new ObjectId(payload.id) },
            { $set: { preferences: newPreferences } },
            { returnDocument: "after", projection: { password: 0 } }
        );

        if (!result) return res.status(404).json({ message: "Usuario no encontrado" });

        res.status(200).json(result.preferences);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ message });
    }
});

router.put("/profile", verifyToken, async (req: AuthRequest, res) => {
  try {
    const payload = req.user as JwtPayload;
    const { username } = req.body as { username: string };

    if (!username || username.trim().length < 3)
      return res.status(400).json({ message: "El username debe tener al menos 3 caracteres" });

    const users = await coleccion();

    const exists = await users.findOne({
      username,
      _id: { $ne: new ObjectId(payload.id) }
    });
    if (exists)
      return res.status(409).json({ message: "Ese nombre de usuario ya está en uso" });

    const result = await users.findOneAndUpdate(
      { _id: new ObjectId(payload.id) },
      { $set: { username: username.trim() } },
      { returnDocument: "after", projection: { password: 0 } }
    );

    if (!result) return res.status(404).json({ message: "Usuario no encontrado" });

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : String(err) });
  }
});

export default router;