import express, { response } from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Vonage } from '@vonage/server-sdk';
import dotenv from 'dotenv';
dotenv.config();


const __dirname = path.dirname(new URL(import.meta.url).pathname);  



const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_DB_API)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));



// User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    houseType: { type: String, required: true },
    address: { type: String, required: true },
    demographic: { type: String, required: true },
    alertFrequency: { type: Number, required: true },
    alertTime: { type: Number, required: true }
});
const userSchema2 = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

// User Model
const User = mongoose.model('UserData', userSchema);

const User2 = mongoose.model('UserInfo', userSchema2);

app.use(express.static(path.join(__dirname, 'pages')));

app.get('/pages/styles.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(path.resolve('../pages/styles.css'));
});

// Registration Route

app.get('',async (req,res)=>{
    res.sendFile(path.resolve('../pages/landing.html'));
})
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const user_name = await User2.findOne({ username });
    if (user_name){
        return res.status(400).json({ error: 'Username Already exists. Please try a different username'})
    }
    const email_db = await User2.findOne({ email });
    if (email_db){
        return res.status(400).json({ error: 'Email Already exists. Login!'})
    }



    const newUser = new User2({ username, email, password });
    try {
        await newUser.save();
        res.status(201).json({ 
            message: 'User registered successfully', 
            userId: newUser._id // Return the user ID
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/register', (req, res) => {
    res.sendFile(path.resolve('../pages/register.html')); 
});
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User2.findOne({ email });

    if (!user || user.password !== password) {
        return res.status(400).json({ error: 'Invalid credentials' });
    }

    return res.status(200).json({userId: user._id});
});
app.get('/login', (req, res) => {
    res.sendFile(path.resolve('../pages/login.html')); 
});

app.get('/report',(req,res)=>{
    res.sendFile(path.resolve('../pages/report.html'));
})

app.post('/forums', async (req, res) => {
    const { title, userId } = req.body;

    try {
        // Fetch the corresponding username for the given userId
        const user = await User2.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Use the username as the creator instead of userId
        const newForum = new Forum({
            title,
            creator: user.username // Store the username
        });

        await newForum.save();
        res.status(201).json({ message: 'Forum created successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});




// Forum Displays TBD :: FIX rendering - add localstorage for users and display



const forumSchema = new mongoose.Schema({
    title: { type: String, required: true },
    creator: { type: String , required: true }, // Change here
    messages: [{ 
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User2' }, // Change here
        content: String,
        timestamp: { type: Date, default: Date.now }
    }]
});



const Forum = mongoose.model('Forum', forumSchema);


app.get('/forum', (req, res) => {
    const userId = req.query.userId; // Get the user ID from the query string
    res.sendFile(path.resolve('../pages/forum.html'));
});
app.get('/forum/:forumId', async (req, res) => {
    res.sendFile(path.resolve('../pages/chatroom.html'));
});
app.post('/forum/:forumId/messages', async (req, res) => {
    const forum = await Forum.findById(req.params.forumId);
    forum.messages.push({
        user: req.body.userId,
        content: String,
        timestamp: new Date(),
    });
    await forum.save();
    res.status(200).send("ok");
});
///// End Forum ///

app.get('/home', (req, res) => {
    // Serve the home page
    res.sendFile(path.resolve('../pages/home.html'));
});
// Object to store timers for users

// ALERTSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS
const userTimers = {};

// Registration Route
app.post('/alert', async (req, res) => {
    const { name, houseType, address, demographic, alertFrequency, alertTime } = req.body;

    const newUser = new User({ name, houseType, address, demographic, alertFrequency, alertTime });
    try {
        await newUser.save();
        
        // Calculate intervals
        const interval = alertFrequency * 60 * 1000; // Convert minutes to milliseconds
        const totalTime = alertTime * 60 * 60 * 1000; // Convert hours to milliseconds

        console.log(interval, totalTime, alertFrequency, alertTime)

        // Function to send alerts for the specific user
        const alertInterval = setInterval(() => {
            // console.log("hi")
            sendAlert(newUser);
        }, interval);

        // Store the timer in the userTimers object using the user's ID
        userTimers[newUser._id] = alertInterval;

        setTimeout(() => {
            clearInterval(userTimers[newUser._id]);
            delete userTimers[newUser._id]; // Clean 
            console.log('Alert frequency timer stopped for user:', newUser._id);
        }, totalTime);
        // add a thank you or smth here
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Alert sending function
const vonage = new Vonage({
    apiKey: process.env.VONAGE_API_KEY,
    apiSecret: process.env.VONAGE_API_SECRET
  })


  const sendAlert = async (user) => {
    // Implement your alert sending logic here
    console.log(`Sending alert to ${user.address} for ${user.houseType}.`);
    let lat, lon;

    const formattedAddress = encodeURIComponent(user.address);
    try{
        console.log("Formatted address is:", formattedAddress);
        const response = await fetch(`https://api.geoapify.com/v1/geocode/search?text=${formattedAddress}&apiKey=${process.env.GOOGLE_GEOCODE_API_KEY}`)
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        const result = await response.json();
        lon = result["features"][0]["geometry"]["coordinates"][0]
        lat = result["features"][0]["geometry"]["coordinates"][1]

    } catch (error) {
        console.error('There has been a problem with your fetch operation for geocode:', error);
    }
    

    let description;
    // Meteomatics 
    const username = process.env.METEOMATICS_API_User;
    const password = process.env.METEOMATICS_API_Password;
    const credentials = `${username}:${password}`;
    const encodedCredentials = btoa(credentials);
    try {
        const csv = await fetch(`https://api.meteomatics.com/${new Date().toISOString()}/weather_text_en:str/${lat},${lon}/csv`, {
            headers: {
                "authorization": `Basic ${encodedCredentials}`,
            }
        }).then(response => response.text());


        description = csv.split("\n")[1].split(";")[1];
        console.log("Weather Description:", description);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        return;
    }
    console.log('---------------------------------------------------------')
    console.log('---------------------------------------------------------')
    // gemini integration
    const genAI = new GoogleGenerativeAI(process.env.LLM_API_KEY);
    let generatedContent; // Declare generatedContent here

    async function run() {
        try {
            const model = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent(
                `Hi I am ${user.name}, Design An Alert addressed to me with instructions tailored to the given prompt and information-> Prompt: ${description} and Input: ${user.houseType}, ${user.address}, ${user.demographic} Dont add important note in the end.`
                );

            generatedContent = result.response.text().replace(/\n\n/g, " ").replace(/\n/g, " ");
            console.log(generatedContent); // Log the generated content
        } catch (error) {
            console.error("Error generating content:", error);
        }
    }
    console.log('---------------------------------------------------------')
    console.log('---------------------------------------------------------')

    await run(); // Wait for the run function to complete

    const from = process.env.VONAGE_PHONE;
    const to = process.env.USER_PHONE;
    const text = generatedContent; // Use generatedContent here
    async function sendSMS() {
        await vonage.sms.send({ to, from, text })
            .then(resp => {
                console.log('Message sent successfully');
                console.log(resp);
            })
            .catch(err => {
                console.error(err);
            });
    }

    sendSMS();
};



app.get('/alert', async (req, res) => {
    res.status(200).type('html').sendFile(path.resolve("../pages/alert.html"));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
