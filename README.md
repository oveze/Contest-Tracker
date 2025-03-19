# Contest Tracker

A comprehensive web application for tracking programming contests across various platforms including Codeforces, CodeChef, and LeetCode.

## Features

- **Multi-platform Support**: Track contests from Codeforces, CodeChef, and LeetCode
- **Real-time Updates**: Auto-refresh contest data every minute
- **Contest Filtering**: Filter contests by platform and status (upcoming, ongoing, past)
- **Bookmarking**: Save contests for easy reference
- **Dark/Light Mode**: Toggle between dark and light themes
- **YouTube Solution Links**: Attach YouTube solution links to past contests (via Admin Panel)
- **Mobile Responsive**: Works on desktop and mobile devices

## Screenshots

(Add screenshots here)

## Technologies Used

### Backend
- Node.js
- Express.js
- MongoDB (with Mongoose)
- Axios for API requests

### Frontend
- React.js
- React Router
- CSS3 with Flexbox/Grid
- Axios for API requests

## Installation

### Prerequisites
- Node.js (v14 or later)
- MongoDB (local or Atlas)
- Git

### Step 1: Clone the Repository
```bash
git clone https://github.com/yourusername/contest-tracker.git
cd contest-tracker
```

### Step 2: Install Dependencies
Install both backend and frontend dependencies:
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### Step 3: Configure Environment Variables
Create a `.env` file in the root directory:
```
MONGODB_URI=your_mongodb_connection_string
PORT=2000
NODE_ENV=development
```

### Step 4: Start the Development Server
```bash
# Start backend server
npm run dev

# In a separate terminal, start the frontend
cd client
npm start
```

The application should now be running with:
- Backend: http://localhost:2000
- Frontend: http://localhost:3000

## API Routes

### Contest Routes
- `GET /api/contests` - Get all contests with optional platform and status filters
- `GET /api/ongoing-contests` - Get currently ongoing contests
- `GET /api/past-contests` - Get past contests
- `POST /api/contests/:id/bookmark` - Bookmark a contest
- `POST /api/contests/:id/unbookmark` - Unbookmark a contest
- `POST /api/contests/:id/solution` - Attach a YouTube solution link

### System Routes
- `GET /api/health` - Check system health
- `GET /api/last-sync` - Get the timestamp of the last data sync
- `POST /api/force-sync` - Manually trigger a data sync

## Project Structure

```
contest-tracker/
├── client/                 # Frontend React application
│   ├── public/             # Public assets
│   └── src/                # React source files
│       ├── components/     # React components
│       └── App.jsx         # Main application component
├── models/                 # Mongoose models
│   └── Contest.js          # Contest schema and model
├── server.js               # Express server entry point
├── package.json            # Project dependencies and scripts
└── README.md               # This file
```

## Data Sources

The application fetches contest data from:
- Codeforces API (https://codeforces.com/api)
- Kontests API (https://kontests.net/api)
- Direct API/scraping fallbacks for reliability

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Production Deployment

To deploy the application to production:

1. Set environment variables:
   ```
   NODE_ENV=production
   MONGODB_URI=your_production_mongodb_uri
   PORT=your_production_port
   ```

2. Build the frontend:
   ```bash
   cd client
   npm run build
   ```

3. Start the production server:
   ```bash
   npm start
   ```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check your MongoDB connection string in the `.env` file
   - Ensure MongoDB is running
   - Check network connectivity if using MongoDB Atlas

2. **API Data Issues**
   - The application has fallback mechanisms if one API source fails
   - Check the API status in the footer of the application
   - Manual sync can be triggered in development mode

3. **React Build Issues**
   - Clear node_modules and reinstall dependencies
   ```bash
   rm -rf node_modules
   npm install
   ```

## License

[MIT](https://choosealicense.com/licenses/mit/)

## Contact

Your Name - Mohammed oveze ovezeov@gmail.com

