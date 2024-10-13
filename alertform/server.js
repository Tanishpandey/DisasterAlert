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

    // Redirect to the forum page after successful login
    // You can pass the user ID if needed
    // res.redirect(`/forum?userId=${user._id}`);
    return res.status(200).json({userId: user._id});
});
app.get('/login', (req, res) => {
    res.sendFile(path.resolve('C:/Users/Tanish/Documents/DisasterAlert/loginsignup/login.html')); 
});

app.post('/forums', async (req, res) => {
    const { title, userId } = req.body;

    const newForum = new Forum({ title, creator: userId });
    try {
        await newForum.save();
        res.status(201).json({ message: 'Forum created successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
app.get('/forums', async (req, res) => {
    res.status(200).json(await Forum.find({}));
});

const forumSchema = new mongoose.Schema({
    title: { type: String, required: true },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User2' }, // Change here
    messages: [{ 
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User2' }, // Change here
        content: String,
        timestamp: { type: Date, default: Date.now }
    }]
});

const Forum = mongoose.model('Forum', forumSchema);



app.get('/forum', (req, res) => {
    const userId = req.query.userId; // Get the user ID from the query string
    res.sendFile(path.resolve('C:/Users/Tanish/Documents/DisasterAlert/loginsignup/forum.html'));
});
// Object to store timers for users
const userTimers = {};

// Registration Route
app.post('/', async (req, res) => {
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
    
    const {lat, lng} = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${formattedAddress}&key=AIzaSyBMiSXDpy8JwGQmqRvTQqTuu_5jRyk7g3E`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log(data);

            const lat = data.results[0].geometry.location.lat;
            const lng = data.results[0].geometry.location.lng;
            console.log(`Latitude: ${lat}, Longitude: ${lng}`);

            return {lat, lng};
        })
        // .catch(error => {
        //     console.error('There has been a problem with your fetch operation:', error);
        // });
    
    const csv = await fetch(`https://api.meteomatics.com/${new Date().toISOString()}/weather_text_en:str/${lat},${lng}/csv`, {
        headers: {
          "authorization": "Basic aGFja3BzdV9wYW5kZXlfdGFuaXNoOjh3NnM3TkhCeTE=",
        }
    })
        .then(response => response.text());

    const description = csv.split("\n")[1].split(";")[1];
    console.log(description)

    // gemini integration
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    async function run() {
    try {
        const model = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent(
        `Hi I am ${user.name}, Design An Alert addressed to me with instructions tailored to the given prompt and information-> Prompt: ${description} and Input: ${user.houseType}, ${user.address}, ${user.demographic} Dont add important note in the end. If there is an emergency give instructions on what to do and details of nearest hostpitals and exit routes`
        );

        console.log(result.response.text().replace(/\n\n/g, " ").replace(/\n/g, " "));
    } catch (error) {
        console.error("Error generating content:", error);
    }
    }

    run();
    // const from = "17722470183"
    // const to = "18144411723"
    // const text = description

    // async function sendSMS() {
    //     await vonage.sms.send({to, from, text})
    //         .then(resp => { console.log('Message sent successfully'); console.log(resp); })
    //         .catch(err => { console.log('There was an error sending the messages.'); console.error(err); });
    // }

    // sendSMS();

};


// Serve HTML
app.get('/', async (req, res) => {
    res.status(200).type('html').sendFile(path.resolve("./alert.html"));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
