import { Router } from "express";
import { getDb } from "../mongo";
import { ObjectId } from "mongodb";
import { WeeklyPlan, PlannerEntry, JwtPayload } from "../types";
import { AuthRequest, verifyToken } from "../middleware/verifyToken";
import { getParam } from "../utils/getParam";

const router = Router();

const coleccion = async() => (await getDb()).collection<WeeklyPlan>("WeeklyPlans");

router.use(verifyToken);


router.get("/:year/:weekNumber", async (req: AuthRequest, res) => {
    try {
        const payload = req.user as JwtPayload;
        const year = parseInt(getParam(req.params.year), 10);
        const weekNumber = parseInt(getParam(req.params.weekNumber), 10);

        if (isNaN(year) || isNaN(weekNumber) || weekNumber < 1 || weekNumber > 53) {
            return res.status(400).json({ message: "year o weekNumber no válidos" });
        }

        const plans = await coleccion();
        const userId = new ObjectId(payload.id);

        let plan = await plans.findOne({ userId, year, weekNumber });

        if (!plan) {
            const newPlan: WeeklyPlan = { userId, year, weekNumber, entries: [] };
            const result = await plans.insertOne(newPlan);
            plan = { ...newPlan, _id: result.insertedId };
        }

        res.status(200).json(plan);
    } catch (err) {
        res.status(500).json({ message: err });
    }
});

router.post("/:year/:weekNumber/entries", async (req: AuthRequest, res) => {
    try {
        const payload = req.user as JwtPayload;
        const year = parseInt(getParam(req.params.year), 10);
        const weekNumber = parseInt(getParam(req.params.weekNumber), 10);
        const { day, mealType, recipe } = req.body as Omit<PlannerEntry, "_id">;

        if (!day || !mealType || !recipe) {
            return res.status(400).json({ message: "day, mealType y recipe son obligatorios" });
        }

        const plans = await coleccion();
        const userId = new ObjectId(payload.id);

        const newEntry: PlannerEntry = { _id: new ObjectId(), day, mealType, recipe };

        const result = await plans.findOneAndUpdate(
            { userId, year, weekNumber },
            { $push: { entries: newEntry } },
            { returnDocument: "after" }
        );

        if (!result) {
            const newPlan: WeeklyPlan = { userId, year, weekNumber, entries: [newEntry] };
            const inserted = await plans.insertOne(newPlan);
            return res.status(201).json({ ...newPlan, _id: inserted.insertedId });
        }

        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({ message: err });
    }
});

router.delete("/:year/:weekNumber/entries/:entryId", async (req: AuthRequest, res) => {
    try {
        const payload = req.user as JwtPayload;
        const year = parseInt(getParam(req.params.year), 10);
        const weekNumber = parseInt(getParam(req.params.weekNumber), 10);
        const entryId = getParam(req.params.entryId);

        const plans = await coleccion();
        const userId = new ObjectId(payload.id);

        const result = await plans.findOneAndUpdate(
            { userId, year, weekNumber },
            { $pull: { entries: { _id: new ObjectId(entryId) } } },
            { returnDocument: "after" }
        );

        if (!result) return res.status(404).json({ message: "Plan no encontrado" });

        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ message: err });
    }
});

export default router;