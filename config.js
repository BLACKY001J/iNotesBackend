const express = require('express');
require('./db.js');
const mongodb = require('mongodb')              
const User = require('./User.js')
var cors = require('cors');
const jwt = require('jsonwebtoken');
const Notes = require('./Notes.js');
const jwtKey = 'idontknow'



const app = express();                // executing the express function

app.use(express.json());             //   app.use is used to mount the middlewares(), The express.json() function is a middleware function used in Express.js applications to parse incoming JSON data from HTTP requests from client-side, a standard format for data transmission in web servers.

// Express.js applications essentially use a middleware that comprises middleware functions such as the 
// express.json() function that processes incoming requests to the express application.
// When a client sends an HTTP request to the server with a JSON payload, the request is first passed 
// through the application's middleware, where the express.json() function converts the JSON string in 
// the payload to a JSON object and populates the req.body property with the parsed JSON, which can be assessed in the application using the req.body object.



// enabling the CROSS ORIGIN RESOURCE SHARING
app.use(cors());                  //    Access to fetch at 'http://localhost:5000/allnotes' from origin/domain 
//     'http://localhost:3000' has been blocked by CORS policy: 
//     Response to preflight request doesn't pass access control 
//     check: No 'Access-Control-Allow-Origin' header is present on 
//      the requested resource. 





// CREATING THE ROUTES

app.post("/register", async (req, res) => {
    let uuser = new User(req.body);
    let user = await uuser.save();
    user = user.toObject();
    delete user.password;
    const data = {
        user: {
            id: user._id
        }
    }
    jwt.sign(data, jwtKey, (err, token) => {                    // jwt.sign(payload/data, secretKey, callback function)
        if (err) {
            return res.send("Something is wrong")
        }
        return res.send({ resultFromdb: user, token: token })
    })

})

app.post("/login", async (req, res) => {
    const { email, password } = req.body
    let user = await User.findOne({ email: email })
    const data = {
        user: {
            id: user._id
        }
    }
    if (user) {
        if (user.password == password) {
            jwt.sign(data, jwtKey, (err, token) => {
                if (err) {
                    return res.status.send(403).send("Something is wrong.")
                }
                return res.status(200).send({ resultFromdb: user, token: token })
            })
        } else {
            return res.status(500).send({ user: "Password Not matched" })
        }
    } else {
        return res.status(401).send({ user: "Not found" })
    }
})

app.post("/addNote", verifyToken, async (req, res) => {
    const { title, description } = req.body;

    const note = new Notes({
        user: req.user.id, title, description
    })
    let result = await note.save();
    res.send(result);
})

app.get('/allnotes', verifyToken, async (req, res) => {
    const resultFromdb = await Notes.find({ user: req.user.id })
    if (resultFromdb.length > 0) {
        res.send(resultFromdb)
    } else {
        res.send({ resultFromdb: "No result Found" })
    }
})

app.delete("/deletenote/:id", verifyToken, async (req, res) => {
    console.log(req.params)
    let resultFromdb = await Notes.findByIdAndDelete({ _id: new mongodb.ObjectId(req.params.id) })
    if (resultFromdb) {
        res.send(resultFromdb)
    } else {
        res.send("No More Results")
    }
})

app.get('/notes/:id', verifyToken, async (req, res) => {
    let resultFromdb = await Notes.findOne({ _id: new mongodb.ObjectId(req.params.id) })  // because we are getting the id from params as string and we have to compare it with in Notes where id exist as objectId so to do so we write it as this.
    if (resultFromdb) {
        res.send(resultFromdb)
    } else {
        res.send({ resultFromdb: "No Record Found." })
    }

})

app.put("/notes/:id", verifyToken, async (req, resp) => {
    let result = await Notes.updateOne(
        { _id: new mongodb.ObjectId(req.params.id) },
        { $set: req.body }               // Uses the $set operator to update the value of the requested note
    )
    resp.send(result)
});



// Middleware function to authenticate the user

function verifyToken(req, res, next) {
    const token = req.header('authorization');
    if (!token) {
        res.status(401).send({ error: "Please authenticate using a valid token" });
    }

    try {
        const data = jwt.verify(token, jwtKey);
        req.user = data.user;                      // By default, when authentication succeeds, the req.user property is set to the authenticated user
        next()

    } catch (error) {
        res.status(401).send({ error: "Please authenticate using a valid token" });
    }
}

app.listen(5000);