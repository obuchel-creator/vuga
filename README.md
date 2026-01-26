# Vuga App

A mobile and backend solution for real-time jam reporting and route suggestions in Vuga.

## Features
- User authentication (email or phone)
- Submit and view jam reports with photos
- Upvote/downvote reports
- Google Maps with live Vuga and route suggestions
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
3. Create MySQL DB: `vuga` and run `users.sql` and `reports.sql`
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


## Troubleshooting & Known Issues

### Automated Testing (React Native)
Due to a known incompatibility between React Native, Jest, and Babel (Flow syntax in react-native's Jest mocks), automated tests in the mobile app may fail with Babel parser errors. This is a common ecosystem issue and not a misconfiguration of this project.

**Workarounds:**
- Manual testing is recommended until the React Native/Jest ecosystem resolves this issue.
- Periodically check for updates to React Native, Jest, and Babel.
- If automated tests are critical, consider migrating to a fresh React Native project and incrementally moving code.

See this section for updates as the ecosystem evolves.

## License
MIT
