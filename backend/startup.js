import mongoose from 'mongoose'
import { config } from 'dotenv'

config()
export async function setup() {
    // mongoose.set('useNewUrlParser', true); // only use for mongoose v5
    // mongoose.set('useFindAndModify', false); // only use for mongoose v5
    // mongoose.set('useCreateIndex', true); // only use for mongoose v5
    // connect to mongodb
    const mongoUrl =
        "mongodb://" +
        process.env.MONGO_USERNAME +
        ":" +
        process.env.MONGO_PASSWORD +
        "@" +
        process.env.MONGO_HOST +
        ":" +
        process.env.MONGO_PORT +
        "/" +
        process.env.MONGO_SCHEMA +
        "?authSource=admin"
    await mongoose.connect(
        mongoUrl,
    ).then(() => {
        console.log(`Connected to MongoDB at ${mongoUrl}`)
    })
}
