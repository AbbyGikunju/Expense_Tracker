const express = require('express');
const app = express();
const mysql = require('mysql2');
const dotenv = require('dotenv');
const cors = require('cors');
const bcrypt = require('bcrypt');

app.use(express.json());
app.use(cors());
dotenv.config()


//connection to database
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
})

// Test connection
db.connect((err) => {
    //if connection doesnt work
    if(err) return console.log("error connecting to MySql")
    //connection works
    console.log("connected to MySql as id: ", db.threadId)    
})

//create database
db.query(`CREATE DATABASE IF NOT EXISTS expense_tracker`, (err,result) =>{
    //if error
    if(err) return console.log("error creating database")

          //no error
        console.log("DB expense_tracker created/checked succesfully");

     //select the expense_tracker db
     db.changeUser({database: 'expense_tracker'}, (err,result) => {
        // if error
        if(err) return console.log("error changing DB")

            //If no error
            console.log("expense_tracker in use");

    //create table
    const createUsersTable = `
         CREATE TABLE IF NOT EXISTS users(
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(100) NOT NULL UNIQUE,
            username VARCHAR(50) NOT NULL,
            password VARCHAR(255) NOT NULL
    )
            `;

            db.query(createUsersTable, (err,result) => {
                //if error
                if(err) return console.log("Error creating table")

                 //if no error
                 console.log("Users table created succesfully");   
            })
     })   
})

//user registration
app.post('/api/register', async(req, res) =>{
    try{
        const users = `SELECT*FROM users WHERE email = ?`
        db.query(users, [req.body.email], (err, data) => {
            //if email exists
            if(data.length > 0) return res.status(400).json("User already exists")
            
                //if no email exists
                //password hashing
                const salt = bcrypt.genSaltSync(10)
                const hashedPassword = bcrypt.hashSync(req.body.password, salt)

                //create user
                const newUser = `INSERT INTO user(email,username,password) VALUES (?)`
                value = [req.body.email, req.body.username, hashedPassword]

                db.query(newUser, [value], (err,data) => {
                    //if insert user fails
                    if(err) return res.status(400).json("something went wrong")

                     //insert user works
                     res.status(200).json("User created succesfully");   
                })
        })
    }
    catch(err) {
        res.status(500).json("Internal Server Error");
    }
})


//user login
app.post('/api/login', async(req,res) => {
    try{
        const users = `SELECT * FROM users WHERE email = ? `
        db.query(users, [req.body.email], (err, data) => {
            //if user not found
            if(data.length === 0) return res.status(404).json("user not found")
                
             //if user exists
             const isPasswordValid = bcrypt.compareSync(req.body.password, data[0].password)   

             //password not valid
             if(!isPasswordValid) return res.status(400).json("Invalid password or email")

             //password and email match
             return res.status(200).json("Login succesfull")   
        })
    }
    catch(err) {
        res.status(500).json("Internal Server Error ")
    }
})

// app.get('', (res, req) => {
//     res.send("evening session")
// })

// running the server
app.listen(3000, ()=>{
    console.log("Server is running on PORT 3000")
})

