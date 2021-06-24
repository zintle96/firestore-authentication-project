const express = require('express');
const app = express();
const path = require('path');
const bodyparser = require('body-parser')
const { body, validationResult } = require('express-validator');
// Firebase configurations
const admin = require('firebase-admin');
const secretKeys = require('./permission.json');

admin.initializeApp({
    credential: admin.credential.cert(secretKeys)
})

// // Firestore and Authentication
const firestore = admin.firestore();
const auth = admin.auth();

app.set('port', process.env.port || 3500) 
app.use(bodyparser.json());

app.get('/', (req, res) => {
    const teamName = "Developed by Tech Express"
    res.send(`<h1>Firebase and Express <br/> ${teamName}<h1>`);
})

//Get all users
app.get('/users', (req, res, next) => {
    const response = [];
    firestore.collection('users').get().then(users => {
        users.forEach(user => {
            response.push({ id: user.id, ...user.data() })
        })
        return res.send(response)
    }).catch(error => {
        return res.status(500).send(error.message);
    })
})

//get user by ID
app.get('/users/:id', function(req, res, next){
    const id = req.params.id;
    if(id === undefined) {
        res.status(500).send("User id is not defined")
    } else {
        firestore.collection('users').doc(id).get().then(response => {
            res.status(200).send({
                id: response.id,
                ...response.data(),
                
            })
        })
    }
})

//Post users using authentication and validation
const userCreationValidators = [
    body('email').isEmail().withMessage("Email is invalid!"),
    body('password').isLength({min: 5}).withMessage("password should contain more than five characters")
   ];
   app.post("/create", userCreationValidators, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
     return res.status(400).json({ errors: errors.array() });
    }
    const user = req.body
        auth.createUser(user).then(userdata => {
          firestore.collection('Users').doc(userdata.uid).set({name:user.name,email:user.email}).then(()=>{
              res.status(200).send('user is created');
          }).catch(error => {
        return res.status(500).send(error.message);
    })
        }).catch(error => {
            return res.status(500).send(error.message);
        })
    })
   
//Delete one user
app.delete('/users/:id', (req, res, next)=>{
    const id = req.params.id;
    if (id === undefined) {
        res.status(500).send('Users not defined')
    } else {
        admin.auth().deleteUser(id).then(()=>{firestore.collection('users').doc(id).delete().then(response =>{
            res.status(200).send('User has been deleted');
        })
        })
    }
})

app.listen(app.get('port'), server =>{
    console.info(`Server listen on port ${app.get('port')}`);
})
