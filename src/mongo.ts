import { Db, MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

let client: MongoClient;
let dB: Db;
const dbName = "PlanificadorDietas";

export const connectMongoDB = async (): Promise<void> => {
  try {
    const mongoUrl = process.env.MONGO_URL!;

    client = new MongoClient(mongoUrl);
    await client.connect();
    dB = client.db(dbName);
    console.log("Connected to mongodb at db " + dbName);
  } catch (error) {
    console.log("Error mongo: ", error);
  }
};

export const getDb = ():Db => dB;