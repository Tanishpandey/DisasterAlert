# DisasterAlert - Tailored AI Alerts

**DisasterAlert** is a full-stack web application designed to provide users with real-time, tailored alerts about weather and emergency situations based on their location, housing type, and other demographics. The platform leverages AI algorithms and multiple APIs to deliver accurate, personalized notifications via SMS and a user-friendly dashboard.

---

## Key Features

1. **Personalized Alerts**  
   - Delivers notifications specific to user preferences, housing types, and geographic locations.  
   - Users can define what types of alerts they want to receive (e.g., floods, hurricanes, wildfires).  

2. **Community Forums**  
   - A built-in forum feature allows users to create or join chat rooms to discuss ongoing disasters, share resources, and provide updates.  

3. **Real-Time Updates**  
   - Integrates with APIs for live weather and disaster data to ensure alerts and updates are always current.  

4. **SMS Notifications**  
   - Uses the Vonage SMS API to send real-time notifications directly to users’ phones, ensuring they stay informed even without constant access to the app.

---

## How DisasterAlert Works

### 1. Frontend: User Interaction
   - **Technology Stack**: React.js (for dynamic, responsive UI).  
   - The user registers or logs in, providing demographic information such as:
     - Location (entered manually or fetched via geolocation services).  
     - Housing type (e.g., apartment, house, trailer).  
     - Alert preferences (e.g., types of disasters they want to monitor).  
   - The dashboard displays:
     - Current weather conditions.  
     - Disaster alerts in the vicinity.  
     - Forum discussions for specific events.  

### 2. Backend: Data Processing and Personalization
   - **Technology Stack**: Node.js, Express.js.  
   - The backend handles:
     - User data management (secured with authentication).  
     - Customizing alerts based on user inputs and geospatial data.  
     - Fetching real-time disaster data from external APIs:
       - **Google Geocode API**: Converts user-entered addresses into precise latitude and longitude coordinates.  
       - **Meteomatics Weather API**: Provides real-time weather updates and disaster information.  
       - **OpenCage API**: Offers additional geolocation support for global coverage.  

### 3. Alert Delivery System
   - The backend uses an AI-driven algorithm to:
     - Analyze weather and disaster data to classify the level of risk.  
     - Tailor alerts by matching real-time data with user preferences and demographics.  
   - **SMS Delivery**:
     - Vonage SMS API sends notifications directly to the user's phone.  
     - For example, if a hurricane is detected near a user’s location, they receive a message like:  
       *"ALERT: Hurricane advisory issued for [Location]. Stay indoors and avoid [specific areas]."*  

### 4. Forum and Community Engagement
   - Users can create forums during disasters to:
     - Discuss ongoing situations.  
     - Share resources like evacuation routes or safe shelters.  
     - Post local updates, which others can view and respond to.  
   - The forum feature is built using MongoDB for fast and scalable data storage, allowing real-time updates.

### 5. Real-Time Data Updates
   - The system periodically pings APIs to fetch new data (via cron jobs).  
   - Any significant changes trigger an event-driven process that:
     - Updates the dashboard for logged-in users.  
     - Sends alerts to relevant users via SMS.  

---

## Technology Stack

### Frontend  
- **React.js**: Dynamic UI components for user interaction.  
- **HTML/CSS**: Styling and layout.  

### Backend  
- **Node.js**: Handles server-side logic and API integrations.  
- **Express.js**: Simplifies server routing and middleware.  

### Database  
- **MongoDB**: Stores user preferences, geospatial data, and forum discussions.  

### APIs  
- **Google Geocode API**: For converting addresses to geospatial data.  
- **Meteomatics Weather API**: Provides real-time weather and disaster data.  
- **Vonage SMS API**: Sends SMS notifications to users.  

---

## How to Set Up Locally

1. **Clone the Repository**  
   ```bash
   git clone https://github.com/tanishpandey/DisasterAlert.git
   cd DisasterAlert


2. **Install Dependencies**

   Make sure you have Node.js and npm installed. If not, download and install them from Node.js official site.
   Install the necessary packages by running the following command in the project root directory:
   ```bash
   Copy code
   npm install


3.**Set Up Environment Variables**

   Create a .env file in the root directory of the project.
   Add the following environment variables to configure your APIs and app keys:
      ```bash
      LLM_API_KEY = your_llm_api_key
      GOOGLE_GEOCODE_API_KEY=your_google_geocode_api_key
      METEOMATICS_API_KEY=your_meteomatics_api_key
      VONAGE_API_KEY=your_vonage_api_key
      VONAGE_API_SECRET=your_vonage_api_secret

4.**Run the Application Locally**

   To start the app, run the following command:
      ```bash
      npm start
   The application will be available at http://localhost:3000. Open this URL in your browser to view the app.

5.**Optional - Set Up MongoDB**

   If you haven't already, you'll need to set up a MongoDB instance to store user data and forum discussions.
   You can use MongoDB Atlas for a cloud-based solution or run a local instance of MongoDB.
   Test the Application
   
   Test the functionality by registering a user, setting up alerts, and checking if real-time notifications are sent to the specified phone number when disaster data changes.

##Potential Future Enhancements
   Hosting: Deploy the app to a cloud service like AWS, Azure, or Heroku for production access.
   Mobile App Integration: Create a mobile app that integrates with the web service for real-time alerts and community engagement.
   Machine Learning: Implement machine learning models to predict disaster events more accurately and provide advanced notifications.
   IoT Integration: Allow integration with IoT devices for automatic responses, such as turning off electrical appliances during a wildfire warning.
   Conclusion
   DisasterAlert is an innovative application designed to improve disaster preparedness and response by providing real-time alerts, community engagement, and a personalized user experience. The platform utilizes multiple APIs, AI, and SMS notifications to keep users informed during emergencies.
   Feel free to explore the repository, contribute to the project, or contact me for further questions!




