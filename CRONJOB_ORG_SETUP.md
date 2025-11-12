# Step-by-Step Guide: Setting Up Cron Job on cron-job.org

This guide will walk you through setting up a cron job on cron-job.org to automatically clear your database at midnight.

## Prerequisites

- Your project must be deployed and accessible via URL
- You need the API endpoint: `/api/cron/clear-db`
- You should have an API key set up (optional but recommended)

## Step 1: Generate an API Key (If Not Already Done)

Generate a secure API key for your cron job:

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

## Step 2: Add API Key to Your Environment Variables

Add the API key to your deployment environment:

**For Vercel:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add: `CRON_API_KEY` = `your-generated-key`
3. Redeploy your project

**For Other Platforms:**
- Add `CRON_API_KEY` to your environment variables in your hosting platform

## Step 3: Sign Up for cron-job.org

1. Go to https://cron-job.org/
2. Click **"Sign Up"** or **"Register"** (top right)
3. Fill in:
   - Email address
   - Password
   - Confirm password
4. Accept the terms and conditions
5. Click **"Create Account"**
6. Check your email and verify your account (if required)

## Step 4: Log In to cron-job.org

1. Go to https://cron-job.org/
2. Click **"Log In"**
3. Enter your email and password
4. Click **"Login"**

## Step 5: Create a New Cron Job

1. After logging in, you'll see the dashboard
2. Click the **"Create cronjob"** button (usually a green button or "+" icon)
3. You'll see a form to configure your cron job

## Step 6: Configure the Cron Job

Fill in the form with the following details:

### Basic Settings

**Title/Name:**
```
Database Clear - Midnight
```
(Or any name you prefer)

**Address (URL):**
```
https://your-domain.com/api/cron/clear-db?key=YOUR_API_KEY
```

**Important:** Replace:
- `your-domain.com` with your actual domain (e.g., `your-project.vercel.app`)
- `YOUR_API_KEY` with the API key you generated in Step 1

**Example:**
```
https://my-app.vercel.app/api/cron/clear-db?key=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

### Schedule Settings

**Schedule Type:** Select **"Cron expression"**

**Cron Expression:** Enter:
```
0 0 * * *
```

**Explanation:**
- `0 0 * * *` = Every day at midnight UTC (00:00 UTC)
- This runs at midnight UTC every day

**Alternative Schedules:**
- `0 5 * * *` = 5 AM UTC (midnight EST)
- `0 8 * * *` = 8 AM UTC (midnight PST)
- `0 18:30 * * *` = 6:30 PM UTC (midnight IST - previous day)

### Request Settings

**Request Method:** Select **"GET"** (or "POST" - both work)

**Timeout:** Set to **30 seconds** (or higher if needed)

**Status Code:** Leave default (200)

### Advanced Settings (Optional)

**Request Headers:** (Usually not needed, but if you want to use header instead of query param)
- Header Name: `x-api-key`
- Header Value: `YOUR_API_KEY`

**Request Body:** Leave empty (not needed for GET requests)

**Follow Redirects:** Check this box (recommended)

**Save Response:** Unchecked (unless you want to save responses)

## Step 7: Test the Cron Job

Before saving, test your configuration:

1. Click the **"Test"** or **"Test URL"** button
2. You should see a response like:
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
3. If you see an error, check:
   - Is your URL correct?
   - Is your API key correct?
   - Is your deployment live and accessible?

## Step 8: Save the Cron Job

1. Review all your settings
2. Click **"Create cronjob"** or **"Save"** button
3. Your cron job is now created!

## Step 9: Activate the Cron Job

1. After creating, you'll see your cron job in the dashboard
2. Make sure the **toggle switch** is **ON** (green/enabled)
3. If it's off, click it to activate

## Step 10: Verify the Cron Job

1. In your cron job list, you should see:
   - **Status:** Active/Enabled (green)
   - **Next Execution:** Shows when it will run next
   - **Last Execution:** Will show after first run

2. Click on your cron job to see:
   - Execution history
   - Response logs
   - Error logs (if any)

## Step 11: Monitor the First Run

1. Wait for the scheduled time (or manually trigger it)
2. After it runs, check:
   - **Last Execution** time
   - **Response** - should show success
   - **Status Code** - should be 200
   - **Logs** - check for any errors

## Step 12: Set Up Notifications (Optional but Recommended)

1. Go to your cron job settings
2. Find **"Notifications"** or **"Alerts"** section
3. Enable email notifications for:
   - Failed executions
   - Successful executions (optional)
4. Enter your email address
5. Save settings

This way, you'll be notified if the cron job fails.

## Troubleshooting

### Cron Job Not Running

**Check:**
- Is the cron job **activated/enabled**? (Toggle should be ON)
- Is the **schedule correct**? (Check cron expression)
- Is your **URL accessible**? (Test it in browser)
- Are there any **errors in logs**?

### "Unauthorized" Error (401)

**Check:**
- Is your API key correct in the URL?
- Is `CRON_API_KEY` set in your environment variables?
- Did you redeploy after adding the environment variable?

**Fix:**
- Double-check the API key in the cron job URL
- Verify the environment variable is set correctly
- Test the URL manually with the API key

### "Failed to Connect" or Timeout

**Check:**
- Is your deployment live and accessible?
- Is the URL correct?
- Is there a firewall blocking the request?

**Fix:**
- Test the URL in your browser first
- Check your deployment status
- Increase timeout in cron job settings

### Wrong Time Zone

**Problem:** Cron job runs at wrong time

**Solution:**
- cron-job.org uses UTC time
- Adjust your cron expression:
  - For EST (UTC-5): Use `0 5 * * *` (5 AM UTC = midnight EST)
  - For PST (UTC-8): Use `0 8 * * *` (8 AM UTC = midnight PST)
  - For IST (UTC+5:30): Use `0 18:30 * * *` (6:30 PM UTC = midnight IST)

## Manual Testing

You can manually trigger the cron job:

1. Go to your cron job in the dashboard
2. Click **"Run now"** or **"Execute"** button
3. Check the response and logs
4. Verify your database was cleared

## Schedule Examples

| Schedule | Cron Expression | Description |
|---------|----------------|-------------|
| Daily at midnight UTC | `0 0 * * *` | Every day at 00:00 UTC |
| Daily at midnight EST | `0 5 * * *` | Every day at 05:00 UTC (midnight EST) |
| Daily at midnight PST | `0 8 * * *` | Every day at 08:00 UTC (midnight PST) |
| Daily at midnight IST | `0 18:30 * * *` | Every day at 18:30 UTC (midnight IST) |
| Weekly on Sunday | `0 0 * * 0` | Every Sunday at midnight UTC |
| Monthly on 1st | `0 0 1 * *` | First day of month at midnight UTC |

## Free Plan Limitations

cron-job.org free plan includes:
- ✅ Up to 2 cron jobs
- ✅ Execution every 1 minute minimum
- ✅ Email notifications
- ✅ Execution history
- ✅ Basic monitoring

**For more cron jobs or shorter intervals**, you may need a paid plan.

## Security Best Practices

1. **Use HTTPS** - Always use `https://` in your URL
2. **Use API Key** - Always include the API key in the URL
3. **Keep API Key Secret** - Don't share your API key
4. **Monitor Logs** - Regularly check execution logs
5. **Set Up Alerts** - Enable email notifications for failures

## Success Checklist

- [ ] API key generated and saved
- [ ] `CRON_API_KEY` added to environment variables
- [ ] Account created on cron-job.org
- [ ] Cron job created with correct URL
- [ ] API key included in URL
- [ ] Schedule set correctly (cron expression)
- [ ] Test executed successfully
- [ ] Cron job activated/enabled
- [ ] Notifications set up (optional)
- [ ] First execution monitored

## Example Complete URL

```
https://my-collab-notes.vercel.app/api/cron/clear-db?key=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

**Breakdown:**
- `https://` - Secure protocol
- `my-collab-notes.vercel.app` - Your domain
- `/api/cron/clear-db` - API endpoint
- `?key=` - Query parameter
- `a1b2c3...` - Your API key

Your cron job should now run automatically at the scheduled time!

## Need Help?

- Check cron-job.org documentation: https://cron-job.org/en/help/
- Test your endpoint manually first
- Check your deployment logs
- Verify environment variables are set

