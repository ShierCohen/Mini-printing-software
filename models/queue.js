const mongoose = require('mongoose');



const queueSchema = new mongoose.Schema({
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
        enum: ['Awaits Operator', 'In queue', 'Printing', 'Canceled', 'Stopped']
    },
    remaining: {
        type: Number
    },
    startTime: {
        type: Date
    }
});


//compile our model
const Queue = mongoose.model('Queue', queueSchema);

module.exports = Queue;



