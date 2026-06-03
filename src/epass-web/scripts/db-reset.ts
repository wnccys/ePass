import mongoose from "mongoose";

async function main() {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
        throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
    }

    const opts = {
        bufferCommands: false,
        family: 4
    };
    const conn = await mongoose.connect(MONGODB_URI!, opts).then((mongooseInstance) => {
        return mongooseInstance;
    });

    conn.connection.db?.dropCollection('agreements');
    console.log('✅ Database cleared.');

    conn.disconnect();
}

main()
    .catch((err) => {
        console.error('❌ Error seeding database:', err);
        process.exit(1);
    })
    .finally(async () => {
        console.log('🔌 Done executing seed script.');
    });