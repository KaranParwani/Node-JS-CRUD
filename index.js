const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const redis = require("redis");
const { json } = require("body-parser");

const app = express();
const port = 6500;

app.use(express.json());
const jwt = require("jsonwebtoken");

const secret_key = "9038520395u82903850923";

let users = []

const redis_client = redis.createClient({
    url: "redis://localhost:6379" 
})

redis_client.connect()
.then(() => console.log("Connected to Redis"))
.catch((err) => console.error("Redis connection error:", err));

// Swagger configuration
const swaggerOptions = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Node.js CRUD API",
        version: "1.0.0",
        description: "A simple CRUD API built with Node.js and Express",
      },
      servers: [
        {
          url: `http://localhost:${port}`,
        },
      ],
    },
    apis: ["./index.js"], // Files containing Swagger annotations
  };
  
  const swaggerDocs = swaggerJsdoc(swaggerOptions);
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * /user_registration:
 *   post:
 *     summary: User Registration
 *     description: Endpoint to register a new user.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *                 description: User's full name.
 *               email:
 *                 type: string
 *                 format: email
 *                 example: example@example.com
 *                 description: User's email address.
 *               password:
 *                 type: string
 *                 format: password
 *                 example: P@ssw0rd!
 *                 description: User's password.
 *     responses:
 *       200:
 *         description: User registration successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered successfully.
 *       400:
 *         description: Invalid input or missing parameters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Name, email, and password are required.
 */

// Registration API
app.post('/user_registration', async (request, response) => {
        const { name, email, password } = request.body;
        console.log(request.body);

        if (!name || !email || !password) {
            return response.status(404).json({message: "All fields are required"});
        }

        try {
            email_exists = await redis_client.hExists("users", email);

            if (email_exists) {
                return response.status(404).json({message: "Email already exists"});
            }
            
            const user = {name, email, password};
            await redis_client.hSet("users", email, JSON.stringify(user));
            return response.status(200).json({message: "User registered successfully"});

        }   
        catch (error) {
            console.log("Error", error);
            return response.status(500).json({message: `Some error occured : ${error}`});
        }
})

/**
 * @swagger
 * /user_login:
 *   post:
 *     summary: User Login
 *     description: Logs in a user using their email and password.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *                 description: The user's email address.
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *                 description: The user's password.
 *     responses:
 *       200:
 *         description: Login successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logged in Successfully.
 *       494:
 *         description: Missing email or password in the request body.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email ID and Password is required.
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Some error occurred: <error message>."
 */

//login API 
app.post('/user_login', async (request, response) => {
    const {email, password} = request.body;
    console.log(email, password);

    if (!email, !password) {
        return response.status(494).json({message: "Email ID and Password is required"});
    }

    try {
        existing_user = await redis_client.hExists("users", email, password);
        console.log(existing_user);

        existing_creds = await redis_client.hGet("users", email);

        if (existing_creds) {
            existing_creds_json = JSON.parse(existing_creds);
            console.log(existing_creds_json.password);
        }

        if (existing_user && password == existing_creds_json.password) {
            const payload = { email };
            const token = jwt.sign(payload, secret_key, {expiresIn : "1h"});
            return response.status(200).json({message: "Logged in Successfully", "token": token});
        }
        response.status(200).json({message: "No email was found or password is incorrect"});
    } 
    catch (error) {
        console.log("Error", error);
        return response.status(500).json({message: `Some error occured : ${error}`});
    }
})

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - email
 *       properties:
 *         id:
 *           type: string
 *           description: The user ID
 *         name:
 *           type: string
 *           description: The user's name
 *         email:
 *           type: string
 *           description: The user's email
 *       example:
 *         id: "1"
 *         name: "Karan"
 *         email: "karan@example.com"
 */

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Missing required fields
 */

app.post("/users", async (requestBody, response) => {
    console.log(requestBody);
    const {id, name, email} = requestBody.body;
    console.log(id, name, email);
    if (!id || !name || !email) {
        return response.status(400).json({message: "All fields are required ID, Name and email"});
    }

    try {

        const existing_user = await redis_client.hExists("users", id);
        if (existing_user) {
            return response.status(409).json({message: `Record with ${id} ID alrealy exists`});
        }

        const user = { name, email };
        await redis_client.hSet("users", id, JSON.stringify(user));
        response.status(200).json({message:"Successfully added Record"});
    }
    catch (err) {
        console.error("Error saving it to Redis :", err);
        response.status(500).json({message:"Internal Server Error"});
    }
})

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */

app.get("/users", async (request, response) => {
    const user_ids = await redis_client.hGetAll("users");

    console.log(user_ids);

    if (user_ids.length === 0) {
        return response.status(404).json({message: "No users found"});
    }

    const users = [];
    for (const user_id in user_ids) {
        console.log(user_id);
        if (user_id) {
            users.push({user_id , ...JSON.parse(user_ids[user_id])});
        }
    }

    response.status(200).json({message: "Successfully fetched data", data: users});
})

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: The user object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */

app.get("/users/:id", async (request, response) => {
    const user_id = request.params.id;
    console.log(user_id); 

    try {
        const user_data = await redis_client.hGet("users", user_id);
        console.log(user_data); 

        if (!user_data) {
            return response.status(404).json({message: "User not found"});
        }
        const user = JSON.parse(user_data);
        response.json(user); 
    }
    catch (error) {
        console.error("Error while updating user record", error);
        response.status(500).json({message: "Internal Server Error", error});
    }
})

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update an existing user
 *     description: Updates a user's details (name and/or email) in the Redis database.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The updated name of the user.
 *               email:
 *                 type: string
 *                 description: The updated email of the user.
 *             example:
 *               name: John Updated
 *               email: john.updated@example.com
 *     responses:
 *       200:
 *         description: User updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User updated successfully
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *       404:
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal Server Error
 */


app.put("/users/:id", async (request, response) => {
    const id = request.params.id;
    const { name, email } = request.body;
    const user_id = users.find((u) => u.id === id);
    
    try {
        const user_data = await redis_client.hGet("users", id);
        console.log(user_data);

        if (!user_data) {
            return response.status(404).json({message : "No user was found"});
        }
        const user = JSON.parse(user_data);

        if (name) user.name = name;
        if (email) user.email = email;

        console.log("here");
        
        await redis_client.hSet("users", id, JSON.stringify(user));
        response.json({message: "User updated successfully", user});
    }
    catch (error) {
        console.error("Error updating data", error);
        response.status(500).json({message: "Error in updating data"});
    }
})


// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Swagger docs available at http://localhost:${port}/api-docs`);
  });
  
