import { MongoClient, Db } from "mongodb";

let client: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function getMongoDb(): Promise<Db> {
	const uri = process.env.MONGODB_URI;
	const dbName = process.env.MONGODB_DB;

	if (!uri) {
		throw new Error("MONGODB_URI is not set");
	}
	if (!dbName) {
		throw new Error("MONGODB_DB is not set");
	}

	if (cachedDb && client) {
		return cachedDb;
	}

	client = new MongoClient(uri, {
		ignoreUndefined: true,
	});
	await client.connect();
	cachedDb = client.db(dbName);
	return cachedDb;
}

export type Collections = {
	users: string;
	content: string;
	messages: string;
};

export const collections: Collections = {
	users: "users",
	content: "content",
	messages: "messages",
};


