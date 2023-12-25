import mongoose from 'mongoose'
import { getRandomString } from "../lib/random.js"
const { Schema } = mongoose
const { ObjectId } = mongoose.Types

const RankingSampleSchema = new Schema({
    sampleId: {
        type: Schema.Types.Mixed,
        validate: {
            validator: (value) => {
                return typeof value === "string" || typeof value === "number"
            },
            message: ({ value }) => `sample_id must be of type String or Number`
        },
        default: () => getRandomString(24),
        unique: true
    },
    input: {
        type: String,
        required: true
    },
    output: {
        type: String,
        required: true
    },
    score: Number,
    metadata: {
        type: Object,
        default: {}
    }
}, {
    versionKey: false,
    timestamps: true
})

RankingSampleSchema.index({ createdAt: 1 })

export const RankingSampleCollection = mongoose.model("RankingSample", RankingSampleSchema, "ranking-samples")