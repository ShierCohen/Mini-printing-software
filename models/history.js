const mongoose = require('mongoose');



const historySchema = new mongoose.Schema({
    jobId: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
        maxlength: 60
    },
    modelPath: {
        type: String,
        required: true
    },
    height: {
        type: Number,
        required: true,
        min: [1, 'must be positive!']
    },
    estimatedTime: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Success', 'Canceled']
    }
});



//compile the model
const History = mongoose.model('History', historySchema);

module.exports = History;


