import mongoose from 'mongoose'
import { config } from 'dotenv'

export async function setup() {
    // mongoose.set('useNewUrlParser', true); // only use for mongoose v5
    // mongoose.set('useFindAndModify', false); // only use for mongoose v5
    // mongoose.set('useCreateIndex', true); // only use for mongoose v5
    config()
    // connect to mongodb
    await mongoose.connect(
        process.env.MONGO_URL,
        { useNewUrlParser: true, useUnifiedTopology: true }
    ).then(() => {
        console.log(`Connected to MongoDB at ${process.env.MONGO_URL}`)
    })
}
