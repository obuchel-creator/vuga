# Deployment Instructions

## Mobile App (Expo)

1. **Install dependencies:**
   ```sh
   cd mobile
   npm install
   ```
2. **Run in development:**
   ```sh
   npx expo start
   ```
3. **Build for production:**
   ```sh
   npx expo build:android   # or build:ios
   # Or for EAS Build:
   npx eas build --platform android
   npx eas build --platform ios
   ```
4. **Publish OTA update:**
   ```sh
   npx expo publish
   ```

## Backend (Node.js)

1. **Install dependencies:**
   ```sh
   cd backend
   npm install
   ```
2. **Run in development:**
   ```sh
   node index.js
   # or with nodemon
   npx nodemon index.js
   ```
3. **Production deployment:**
   - Use a process manager like PM2:
     ```sh
     npm install -g pm2
     pm2 start index.js --name vuga-backend
     ```
   - Set environment variables for DB, ports, etc.
   - Use a reverse proxy (e.g., Nginx) for HTTPS and load balancing.

## Environment Variables
- Store secrets and config in a `.env` file (use dotenv in backend).
- Never commit secrets to version control.

## Additional Steps
- Run all tests before deploying:
  ```sh
  cd mobile && npm test
  cd ../backend && npm test # if tests exist
  ```
- Review README for usage and troubleshooting.
