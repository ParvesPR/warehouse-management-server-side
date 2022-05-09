const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
require('dotenv').config();
const app = express();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const res = require("express/lib/response");
const { query } = require('express');

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// JWT
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(404).send({ message: 'unauthorized access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
        if (error) {
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        console.log('decoded', decoded);
        req.decoded = decoded;
    })
    next();
}

// CONNECTED TO MONGODB

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ux7tj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
console.log('Connected to MongoDB')

async function run() {
    try {
        await client.connect();
        const productCollection = client.db('warehouse').collection('products');

        // GET API LOAD DATA FOR HOME PAGE
        app.get('/products', async (req, res) => {
            const query = {};
            const cursor = productCollection.find(query);
            const product = await cursor.limit(6).toArray();
            res.send(product)
        });
        //AUTH
        app.post('/login', (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '10d'
            })
            res.send({ accessToken })
        })

        // GET API LOAD DATA FOR INVENTORY
        app.get('/inventory', async (req, res) => {
            const query = {};
            const cursor = productCollection.find(query);
            const product = await cursor.toArray();
            res.send(product)
        });

        // GET ITEM BY PRODUCT ID
        app.get('/inventory/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await productCollection.findOne(query);
            res.send(product);
        });

        // DELIVERED ITEM
        app.put('/delivered/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const currentQuantity = req.body;
            console.log(currentQuantity);
            const filter = { _id: ObjectId(id) }
            const option = { upsert: true };
            const updateDoc = {
                $set: {
                    quantity: currentQuantity.quantity - 1
                }
            };
            const newQuantity = await productCollection.updateOne(filter, updateDoc, option)
            res.send(newQuantity)
        });

        // ADD TO STOCK
        app.put('/addtostock/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const currentQuantity = req.body;
            console.log(currentQuantity);
            const filter = { _id: ObjectId(id) }
            const option = { upsert: true };
            const updateDoc = {
                $set: {
                    quantity: currentQuantity.newQuantity
                }
            };
            const newQuantity = await productCollection.updateOne(filter, updateDoc, option)
            res.send(newQuantity)
        });

        // ADD ITEM COLLECTION
        app.post('/inventory', async (req, res) => {
            const newItem = req.body;
            const result = await productCollection.insertOne(newItem);
            res.send(result)
        });

        // GET ADDED ITEMS
        app.get('/myitems', verifyJWT, async (req, res) => {
            const decodedEmail = req?.decoded?.email;
            const email = req?.query?.email;
            if (email === decodedEmail) {
                const query = { email: email };
                const cursor = productCollection.find(query);
                const orders = await cursor.toArray();
                res.send(orders)
            }
            else {
                res.status(403).send({ message: 'Forbidden Access' })
            }
        });

        // DELETE ITEM MY ITEMS
        app.delete('/myitems/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productCollection.deleteOne(query);
            res.send(result)
        });
        // DELETE ITEM
        app.delete('/inventory/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productCollection.deleteOne(query);
            res.send(result)
        });
    }

    finally {

    }
}
run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('Warehouse server running')
});
app.listen(port, () => {
    console.log('Listening to port', port)
})
