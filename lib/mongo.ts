import { MongoClient, Db } from "mongodb";

let client: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function getMongoDb(): Promise<Db> {
	const uri = process.env.MONGODB_URI;
	const dbName = process.env.MONGODB_DB;

	if (!uri) {
		const error = "MONGODB_URI is not set";
		console.error(error);
		throw new Error(error);
	}
	if (!dbName) {
		const error = "MONGODB_DB is not set";
		console.error(error);
		throw new Error(error);
	}

	// In serverless environments, connections might not persist
	// Check if we have a cached connection (for optimization in long-running processes)
	if (cachedDb && client) {
		// Return cached connection (will be recreated if dead on actual operation)
		return cachedDb;
	}

	// Create new connection
	try {
		client = new MongoClient(uri, {
			ignoreUndefined: true,
			maxPoolSize: 10,
			serverSelectionTimeoutMS: 5000,
			socketTimeoutMS: 45000,
		});
		await client.connect();
		cachedDb = client.db(dbName);
		return cachedDb;
	} catch (error: any) {
		console.error("MongoDB connection error:", error.message);
		throw new Error(`Failed to connect to MongoDB: ${error.message}`);
	}
}

export type Collections = {
	users: string;
	content: string;
	messages: string;
	settings: string;
};

export const collections: Collections = {
	users: "users",
	content: "content",
	messages: "messages",
	settings: "settings",
};


