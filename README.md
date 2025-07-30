🚗 7chalo – Ride-Sharing Mobile App
7chalo is a React Native-based mobile application designed for seamless ride-sharing experiences. Built for both riders and drivers, the app enables secure registration, real-time ride matching, and instant notifications.

📱 Features
🔐 User Authentication

Register/Login with email

Email verification via SendGrid

Secure password storage

🌐 Backend Integration

Custom REST APIs using Node.js

Connected with HeidiSQL (MySQL) database

Hosted via Cloudflare reverse proxy

🔔 Push Notifications

Integrated Firebase Cloud Messaging (FCM) for real-time alerts (ride status, messages, etc.)

📍 Ride Matching System

Riders can request rides

Drivers can accept rides

Location handling (optional: GPS integration)

👤 Profile Management

Update user information

Change password

# Clone the repo
git clone https://github.com/yourusername/7chalo-app.git
cd 7chalo-app

# Install dependencies
npm install

# Start the app
npx react-native run-android
# or
npx react-native run-ios

Backend Setup
Configure API endpoints and database credentials in config.js

Start the server:
node server.js

🔐 Environment Variables
Create a .env file in both frontend and backend directories with:

Frontend:
API_BASE_URL=https://yourapiurl.com/api

Backend:
DB_HOST=localhost
DB_USER=root
DB_PASS=yourpassword
DB_NAME=7chalo_db
SENDGRID_API_KEY=your_sendgrid_key
JWT_SECRET=your_secret_key
FCM_SERVER_KEY=your_firebase_key

👨‍💻 Developer
Syed Mutaher Ali
Computer Science Student & Mobile App Developer
