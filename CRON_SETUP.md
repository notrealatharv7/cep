# Database Clear Cron Job Setup

This guide explains how to set up automatic database clearing at midnight.

## Overview

The application includes a cron endpoint that clears the database every day at midnight. It removes:
- All content (sessions and shared content/files)
- All messages (chat messages)
- All rewards (reward records)

**Note:** The following are preserved:
- Users collection (users and their points are kept)
- Settings collection (including access codes)

## Setup Steps

### 1. Set Environment Variable (Optional but Recommended)

Add a secure API key to your `.env.local` file:

```env
CRON_API_KEY=your-secure-random-key-here
```

Generate a secure key:
```bash
# On Linux/Mac
openssl rand -hex 32

# Or use any random string generator
```

### 2. Choose a Cron Service

You have several options for scheduling the task:

#### Option A: Vercel Cron Jobs (Recommended if deployed on Vercel)

If you're deploying on Vercel, add this to your `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/clear-db",
      "schedule": "0 0 * * *"
    }
  ]
}
```

And set the `CRON_API_KEY` in your Vercel environment variables.

#### Option B: External Cron Service (Recommended for other hosting)

Use a free cron service like:
- **cron-job.org** (https://cron-job.org)
- **EasyCron** (https://www.easycron.com)
- **UptimeRobot** (https://uptimerobot.com)

**Setup Instructions:**

1. Sign up for a cron service
2. Create a new cron job with:
   - **URL**: `https://your-domain.com/api/cron/clear-db?key=YOUR_CRON_API_KEY`
   - **Schedule**: `0 0 * * *` (runs at midnight UTC every day)
   - **Method**: GET or POST
   - **Timezone**: Adjust to your local midnight if needed

**Example URLs:**
- With API key: `https://your-domain.com/api/cron/clear-db?key=your-secure-key`
- Without API key (if CRON_API_KEY not set): `https://your-domain.com/api/cron/clear-db`

#### Option C: Server-Side Cron (For self-hosted servers)

If you have a persistent server, you can use `node-cron`:

1. Install node-cron:
```bash
npm install node-cron
```

2. Create a cron script (`scripts/daily-clear.js`):

```javascript
const cron = require('node-cron');
const https = require('https');

// Run at midnight every day
cron.schedule('0 0 * * *', () => {
  const url = new URL(process.env.APP_URL + '/api/cron/clear-db');
  if (process.env.CRON_API_KEY) {
    url.searchParams.set('key', process.env.CRON_API_KEY);
  }
  
  https.get(url.toString(), (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log('Database cleared:', data);
    });
  }).on('error', (err) => {
    console.error('Error clearing database:', err);
  });
});
```

3. Run it with your Node.js process or use PM2 to keep it running.

### 3. Test the Endpoint

Test the endpoint manually:

```bash
# With API key
curl "https://your-domain.com/api/cron/clear-db?key=YOUR_CRON_API_KEY"

# Without API key (if CRON_API_KEY not set)
curl "https://your-domain.com/api/cron/clear-db"
```

You should receive a JSON response:
```json
{
  "success": true,
  "message": "Database cleared successfully",
  "deletedCounts": {
    "users": 10,
    "content": 5,
    "messages": 50
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Timezone Considerations

- The cron schedule `0 0 * * *` runs at midnight UTC by default
- Adjust the schedule based on your timezone:
  - EST (UTC-5): `0 5 * * *` (5 AM UTC = midnight EST)
  - PST (UTC-8): `0 8 * * *` (8 AM UTC = midnight PST)
  - IST (UTC+5:30): `0 18:30 * * *` (previous day 6:30 PM UTC = midnight IST)

## Security Notes

1. **Always use HTTPS** for the cron endpoint URL
2. **Set CRON_API_KEY** to prevent unauthorized access
3. **Keep your API key secret** - don't commit it to version control
4. **Monitor the cron job** to ensure it runs successfully

## Troubleshooting

### Cron job not running
- Check the cron service logs
- Verify the URL is accessible
- Ensure the API key matches (if set)

### Unauthorized error
- Verify `CRON_API_KEY` matches in both `.env.local` and cron service
- Check that the key is being sent correctly in the request

### Database not clearing
- Check server logs for errors
- Verify MongoDB connection is working
- Test the endpoint manually first

## Manual Clear

You can also manually trigger a database clear by calling the endpoint:

```bash
curl -X POST "https://your-domain.com/api/cron/clear-db?key=YOUR_KEY"
```

