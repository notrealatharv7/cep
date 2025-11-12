# Remove Users from Database Guide

This guide explains how to remove users from the MongoDB database.

## Available Functions

### 1. Remove All Users
Removes all users (both teachers and students) from the database.

### 2. Remove Users by Role
Removes all users with a specific role (either "teacher" or "student").

### 3. Remove Specific User
Removes a specific user by their name.

## Methods

### Method 1: Using API Endpoint (Recommended)

#### Remove All Users

**GET Request:**
```bash
curl "https://your-domain.com/api/admin/remove-users?action=all&key=YOUR_API_KEY"
```

**POST Request:**
```bash
curl -X POST "https://your-domain.com/api/admin/remove-users?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "all"}'
```

#### Remove Users by Role

**GET Request:**
```bash
# Remove all teachers
curl "https://your-domain.com/api/admin/remove-users?action=byRole&role=teacher&key=YOUR_API_KEY"

# Remove all students
curl "https://your-domain.com/api/admin/remove-users?action=byRole&role=student&key=YOUR_API_KEY"
```

**POST Request:**
```bash
curl -X POST "https://your-domain.com/api/admin/remove-users?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "byRole", "role": "teacher"}'
```

#### Remove Specific User

**GET Request:**
```bash
curl "https://your-domain.com/api/admin/remove-users?action=byName&userName=John%20Doe&key=YOUR_API_KEY"
```

**POST Request:**
```bash
curl -X POST "https://your-domain.com/api/admin/remove-users?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "byName", "userName": "John Doe"}'
```

### Method 2: Using Server Actions (For Development)

You can import and use these functions directly in your code:

```typescript
import { removeAllUsers, removeUsersByRole, removeUser } from "@/app/actions";

// Remove all users
const result = await removeAllUsers();

// Remove all teachers
const result = await removeUsersByRole("teacher");

// Remove all students
const result = await removeUsersByRole("student");

// Remove specific user
const result = await removeUser("John Doe");
```

## Security

The API endpoint requires an API key for security. Set one of these environment variables:

```env
CRON_API_KEY=your-secure-key-here
# OR
ADMIN_API_KEY=your-secure-key-here
```

If no API key is set, the endpoint will be accessible without authentication (not recommended for production).

## Response Format

All endpoints return JSON responses:

**Success:**
```json
{
  "success": true,
  "message": "Users removed successfully",
  "deletedCount": 5,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message here"
}
```

## Examples

### Remove All Students
```bash
curl "https://your-domain.com/api/admin/remove-users?action=byRole&role=student&key=YOUR_KEY"
```

### Remove Specific Teacher
```bash
curl "https://your-domain.com/api/admin/remove-users?action=byName&userName=Teacher%20Name&key=YOUR_KEY"
```

### Remove All Users (Clean Slate)
```bash
curl "https://your-domain.com/api/admin/remove-users?action=all&key=YOUR_KEY"
```

## Notes

- Removing users does NOT remove:
  - Content (sessions, shared files)
  - Messages (chat messages)
  - Rewards (reward records)
  - Settings (access codes, etc.)

- To remove everything, use the `clearDatabase` function instead (see `CRON_SETUP.md`)

- User removal is permanent and cannot be undone

- The API key should be kept secret and not committed to version control

