import mongoose from 'mongoose'
import { config } from 'dotenv'

export async function setup() {
    mongoose.set('useNewUrlParser', true);
    mongoose.set('useFindAndModify', false);
    mongoose.set('useCreateIndex', true);
    config()
    // connect to mongodb
    await mongoose.connect(
        process.env.MONGO_URL,
        { useNewUrlParser: true, useUnifiedTopology: true }
    ).then(() => {
        console.log(`Connected to MongoDB at ${process.env.MONGO_URL}`)
    })
}
