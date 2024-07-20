const mongoose = require('mongoose')            

const notesSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    title: String,
    description: String,
    date: {
        type: Date,
        default: Date.now()
    }
})

module.exports = mongoose.model('notes',notesSchema)