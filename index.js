const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
require('dotenv').config();
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// CONNECTED TO MONGODB

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ux7tj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
console.log('Connected to MongoDB')

async function run() {
    try {
        await client.connect();
        const productCollection=client.db('warehouse').collection('products')
    }

    finally {

    }
}

app.get('/', (req, res) => {
    res.send('Warehouse server running')
});
app.listen(port, () => {
    console.log('Listening to port', port)
})
