import { ObjectId } from "mongodb";

export type User = {
    _id?: ObjectId;
    email: string;
    username: string;
    password: string;
    preferences?: DietPreferences;
};

export type DietPreferences = {
    diet?: string;             
    health?: string[];         
    cuisineType?: string[];   
    excludedIngredients?: string[];
    calorieTarget?: number | null;
};

export type JwtPayload = {
    id: string;
    email: string;
};

export type Day = "lunes" | "martes" | "miercoles" | "jueves" | "viernes" | "sabado" | "domingo";
export type MealType = "desayuno" | "almuerzo" | "comida" | "merienda" | "cena";

export type PlannerRecipe = {
    edamamId: string;
    label: string;
    image?: string;
    calories?: number;
    totalTime?: number;
    yield?: number;
    url?: string;
    ingredients?: { text: string }[];
};

export type PlannerEntry = {
    _id?: ObjectId;
    day: Day;
    mealType: MealType;
    recipe: PlannerRecipe;
};

export type WeeklyPlan = {
    _id?: ObjectId;
    userId: ObjectId;
    year: number;
    weekNumber: number;
    entries: PlannerEntry[];
};