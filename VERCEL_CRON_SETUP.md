# Step-by-Step Guide: Setting Up Cron Job on Vercel

This guide will walk you through setting up a cron job on Vercel to automatically clear your database at midnight.

## Prerequisites

- Your project must be deployed on Vercel
- You need access to your Vercel dashboard
- Your project should already have the `/api/cron/clear-db` endpoint

## Step 1: Generate an API Key

First, generate a secure API key for your cron job:

**Option A: Using OpenSSL (Linux/Mac)**
```bash
openssl rand -hex 32
```

**Option B: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option C: Online Generator**
- Visit https://randomkeygen.com/
- Use a "CodeIgniter Encryption Keys" or similar

**Save this key** - you'll need it in the next steps.

## Step 2: Add API Key to Vercel Environment Variables

1. Go to your Vercel Dashboard: https://vercel.com/dashboard
2. Select your project
3. Click on **Settings** (in the top navigation)
4. Click on **Environment Variables** (in the left sidebar)
5. Click **Add New**
6. Fill in:
   - **Key**: `CRON_API_KEY`
   - **Value**: Paste the API key you generated in Step 1
   - **Environment**: Select all (Production, Preview, Development) or just Production
7. Click **Save**
8. **Important**: If your project is already deployed, you need to redeploy for the environment variable to take effect

## Step 3: Create vercel.json File

1. In your project root directory, create a file named `vercel.json` (if it doesn't exist)
2. Add the following content:

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

**Explanation:**
- `path`: The API route that will be called
- `schedule`: Cron expression - `0 0 * * *` means "at midnight UTC every day"

**Alternative Schedules:**
- `0 0 * * *` - Midnight UTC (00:00 UTC)
- `0 5 * * *` - 5 AM UTC (midnight EST)
- `0 8 * * *` - 8 AM UTC (midnight PST)
- `0 18:30 * * *` - 6:30 PM UTC (midnight IST)

## Step 4: Update API Route to Use API Key

Your API route should already check for the API key. Verify that `/app/api/cron/clear-db/route.ts` includes:

```typescript
const apiKey = request.nextUrl.searchParams.get("key") || request.headers.get("x-api-key");
const expectedKey = process.env.CRON_API_KEY;

if (expectedKey && apiKey !== expectedKey) {
  return NextResponse.json(
    { success: false, error: "Unauthorized" },
    { status: 401 }
  );
}
```

**Note**: Vercel automatically passes the API key in the `x-vercel-cron` header, but our route checks for it in query params or headers.

## Step 5: Commit and Push to Git

1. Add the `vercel.json` file to git:
   ```bash
   git add vercel.json
   git commit -m "Add Vercel cron job configuration"
   git push
   ```

2. Vercel will automatically detect the changes and redeploy

## Step 6: Verify Deployment

1. Go to your Vercel Dashboard
2. Click on your project
3. Go to **Deployments** tab
4. Wait for the latest deployment to complete (should show "Ready")
5. Check the deployment logs to ensure there are no errors

## Step 7: Test the Cron Job Manually

Before waiting for midnight, test the endpoint manually:

1. Get your deployment URL (e.g., `https://your-project.vercel.app`)
2. Test with curl or in your browser:
   ```bash
   curl "https://your-project.vercel.app/api/cron/clear-db?key=YOUR_API_KEY"
   ```

   Or visit in browser:
   ```
   https://your-project.vercel.app/api/cron/clear-db?key=YOUR_API_KEY
   ```

3. You should see a JSON response:
   ```json
   {
     "success": true,
     "message": "Database cleared successfully",
     "deletedCounts": {
       "content": 0,
       "messages": 0,
       "rewards": 0
     },
     "timestamp": "2024-01-01T00:00:00.000Z"
   }
   ```

## Step 8: Monitor Cron Job Execution

1. Go to Vercel Dashboard → Your Project → **Cron Jobs** tab
2. You should see your cron job listed
3. After it runs, you can see:
   - Last run time
   - Next run time
   - Execution status
   - Logs

## Step 9: Check Logs (After First Run)

1. Go to Vercel Dashboard → Your Project → **Logs** tab
2. Filter by "Cron" or search for "clear-db"
3. Check for any errors or issues

## Troubleshooting

### Cron Job Not Appearing
- Make sure `vercel.json` is in the root directory
- Verify the JSON syntax is correct (use a JSON validator)
- Ensure you've pushed and deployed the changes

### "Unauthorized" Error
- Double-check that `CRON_API_KEY` is set in Vercel environment variables
- Verify the API key matches what you're using in the test
- Make sure you've redeployed after adding the environment variable

### Cron Job Not Running
- Check the schedule in `vercel.json` - it uses UTC time
- Verify the path is correct: `/api/cron/clear-db`
- Check Vercel logs for any errors
- Ensure your project is on a Vercel plan that supports cron jobs (Pro plan or higher)

### Database Not Clearing
- Check the API route logs in Vercel
- Verify MongoDB connection is working
- Test the endpoint manually first
- Check that the function has proper error handling

## Important Notes

1. **Vercel Cron Jobs require a Pro plan or higher** (free plan doesn't support cron jobs)
2. **Time is in UTC** - adjust your schedule accordingly
3. **Environment variables** must be set and the project redeployed
4. **Cron jobs run on the Production deployment** by default
5. **API key is required** for security - don't skip this step

## Alternative: Using External Cron Service (Free)

If you're on the Vercel free plan, you can use an external cron service:

1. Sign up at https://cron-job.org (free)
2. Create a new cron job
3. Set URL: `https://your-project.vercel.app/api/cron/clear-db?key=YOUR_API_KEY`
4. Set schedule: `0 0 * * *` (midnight UTC)
5. Save and activate

This works the same way but uses an external service to ping your endpoint.

## Schedule Examples

| Schedule | Description |
|---------|-------------|
| `0 0 * * *` | Every day at midnight UTC |
| `0 5 * * *` | Every day at 5 AM UTC (midnight EST) |
| `0 8 * * *` | Every day at 8 AM UTC (midnight PST) |
| `0 0 * * 0` | Every Sunday at midnight UTC |
| `0 0 1 * *` | First day of every month at midnight UTC |

## Success Checklist

- [ ] API key generated and saved
- [ ] `CRON_API_KEY` added to Vercel environment variables
- [ ] `vercel.json` file created with cron configuration
- [ ] Changes committed and pushed to git
- [ ] Project redeployed on Vercel
- [ ] Manual test of endpoint successful
- [ ] Cron job appears in Vercel dashboard
- [ ] Verified cron job schedule is correct

Your cron job should now run automatically at the scheduled time!

