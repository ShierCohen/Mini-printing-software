const mongoose = require('mongoose');
const Queue = require('./models/queue');

mongoose.connect('mongodb://localhost:27017/queue', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("MONGO CONNECTION OPEN!!!")
    })
    .catch(err => {
        console.log("OH NO MONGO CONNECTION ERROR!!!!")
        console.log(err)
    })


const seedprints = [
    {
        id: '1',
	name: 'first print',
	height: 3,
	estimatedTime: 5,
        status: 'Printing',
        modelPath: 'vegetable'
    }
]

/* Queue.insertMany(seedprints )
    .then(res => {
        console.log(res)
    })
    .catch(e => {
        console.log(e)
    }) */

    Queue.findOneAndDelete({name: 'first print'});