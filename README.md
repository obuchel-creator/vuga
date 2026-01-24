# Kampala Traffic App

A mobile and backend solution for real-time traffic jam reporting and route suggestions in Kampala.

## Features
- User authentication (email or phone)
- Submit and view traffic jam reports with photos
- Upvote/downvote reports
- Google Maps with live traffic and route suggestions
- Push notifications for severe jams
- REST API backend with MySQL

## Project Structure
- `/mobile` — React Native app
- `/backend` — Node.js Express API

## Setup

### Prerequisites
- Node.js 20+
- MySQL (WAMP/XAMPP or cloud)
- (For mobile) Android Studio/Xcode or a real device

### Backend
1. `cd backend`
2. `npm install`
3. Create MySQL DB: `kampala_traffic` and run `users.sql` and `reports.sql`
4. `node index.js` (runs on port 3000 by default)

### Mobile
1. `cd mobile`
2. `npm install`
3. Update API URLs in `App.js` if needed
4. Run on device/emulator: `npx react-native run-android` or `npx react-native run-ios`

## Usage
- Register/login with email or phone
- Tap map to select location, fill form, optionally add a photo, and submit
- View, upvote/downvote, and filter reports
- Get route suggestions and jam warnings

## Contributing
- Fork and clone the repo
- Create a feature branch
- Submit pull requests with clear descriptions
- See `.github/CONTRIBUTING.md` for more

## License
MIT
