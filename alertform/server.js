import express, { response } from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Vonage } from '@vonage/server-sdk';
import dotenv from 'dotenv';
dotenv.config();



const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect('mongodb+srv://tanishpandey3:NextStep123@nextstep.24ldi.mongodb.net/NextStep')
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

// Registration Route
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

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
    res.sendFile(path.resolve('C:/Users/Tanish/Documents/DisasterAlert/loginsignup/register.html')); 
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
    res.sendFile(path.resolve('C:/Users/Tanish/Documents/DisasterAlert/loginsignup/login.html')); 
});

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

app.get('/styles.css', (req, res) => {
    res.sendFile(path.resolve('../loginsignup/styles.css'));
});

app.use('/public/', express.static(path.resolve("../public")));

app.get('/forum', (req, res) => {
    const userId = req.query.userId; // Get the user ID from the query string
    res.sendFile(path.resolve('C:/Users/Tanish/Documents/DisasterAlert/loginsignup/forum.html'));
});
app.get('/forum/:forumId', async (req, res) => {
    res.sendFile(path.resolve('../loginsignup/chatroom.html'));
});
app.post('/forums/:forumId/messages', async (req, res) => {
    const forum = await Forum.findById(req.params.forumId);
    forum.messages.push({
        user: req.body.userId,
        content: req.body.content,
        timestamp: new Date(),
    });
    await forum.save();
    res.status(200).send("ok");
});

app.get('/forums', async (req, res) => {
    try {
        const forums = await Forum.find({});
        res.status(200).json(forums);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/forums/info', async (req, res) => {
    const forumId = req.query.id; // Get the forum ID from the query parameters
    const forum = await Forum.findById(forumId);
    
    // Check if forum was found
    if (!forum) {
        return res.status(404).json({ error: 'Forum not found' });
    }

    // Process messages and fetch usernames
    for (const message of forum.messages) {
        const user = await User2.findById(message.user);
        message.username = user?.username ?? null; // Assign username if found
    }
    
    res.status(200).json(forum);
});
app.get('/home', (req, res) => {
    // Serve the home page
    res.sendFile(path.resolve('C:/Users/Tanish/Documents/DisasterAlert/loginsignup/home.html'));
});
// Object to store timers for users
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

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Alert sending function
const vonage = new Vonage({
    apiKey: "35f6099b",
    apiSecret: "pjFH2IATq1WFVXcl"
  })


  const sendAlert = async (user) => {
    // Implement your alert sending logic here
    console.log(`Sending alert to ${user.address} for ${user.houseType}.`);

    const formattedAddress = user.address.replace(/\s+/g, '+');

    const { lat, lng } = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${formattedAddress}&key=AIzaSyBMiSXDpy8JwGQmqRvTQqTuu_5jRyk7g3E`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            if (!data.results || data.results.length === 0) {
                throw new Error('No results found for the given address');
            }
            const lat = data.results[0].geometry.location.lat;
            const lng = data.results[0].geometry.location.lng;
            console.log(`Latitude: ${lat}, Longitude: ${lng}`);
            return { lat, lng };
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
        });

    const csv = await fetch(`https://api.meteomatics.com/${new Date().toISOString()}/weather_text_en:str/${lat},${lng}/csv`, {
        headers: {
            "authorization": "Basic aGFja3BzdV9wYW5kZXlfdGFuaXNoOjh3NnM3TkhCeTE=",
        }
    })
    .then(response => response.text());

    const description = csv.split("\n")[1].split(";")[1];
    console.log(description);

    // gemini integration
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
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

    await run(); // Wait for the run function to complete

    const from = "17722470183";
    const to = "18144411723";
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



// Serve HTML
app.get('/alert', async (req, res) => {
    res.status(200).type('html').sendFile(path.resolve("C:/Users/Tanish/Documents/DisasterAlert/alertform/alert.html"));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
