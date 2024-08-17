import mongoose from 'mongoose'
import { getRandomString } from "../lib/random.js"
const { Schema } = mongoose
const { ObjectId } = mongoose.Types


const RankingOutputSchema = new Schema({
    content: {
        type: String,
        required: true
    },
    score: {
        type: Number,
        default: 0
    },
    metadata: {
        type: Object,
        default: {}
    }
}, { _id: false })

const Comparison = new Schema({
    positives: {
        type: [RankingOutputSchema],
        default: []
    },
    negatives: {
        type: [RankingOutputSchema],
        default: []
    },
}, { _id: false })

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
    outputs: {
        type: [RankingOutputSchema],
        required: true
    },
    comparisons: {
        type: [Comparison],
        required: false
    },
    metadata: {
        type: Object,
        default: {}
    }
}, {
    versionKey: false,
    timestamps: true
})

RankingSampleSchema.index({ createdAt: 1 })

export const RankingSampleCollection = mongoose.model("RankingSample", RankingSampleSchema, process.env.MONGO_COLLECTION)