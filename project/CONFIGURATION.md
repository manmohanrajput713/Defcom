# DEFCom App Configuration Guide

## Supabase Setup Required

The app requires Supabase configuration to function properly. Follow these steps:

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project URL and anon key

### 2. Environment Configuration

Create a `.env` file in the project root (`MBU-main/project/.env`) with:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Database Setup

Run the SQL migrations in your Supabase SQL editor:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the migration files from `supabase/migrations/` folder

### 4. Build Configuration

For production builds, ensure environment variables are set:

#### Option A: Using EAS Build
Add environment variables to your EAS build configuration in `eas.json`:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "your-production-url",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-production-key"
      }
    }
  }
}
```

#### Option B: Using app.json
Add environment variables to `app.json`:

```json
{
  "expo": {
    "extra": {
      "EXPO_PUBLIC_SUPABASE_URL": "your-production-url",
      "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-production-key"
    }
  }
}
```

### 5. Testing Configuration

The app will now start without crashing, but will show warnings in the console if Supabase is not configured. You can test the UI without a backend connection.

### 6. Security Notes

- Never commit your `.env` file to version control
- Use different keys for development and production
- The anon key is safe to use in client-side code
- Consider using Row Level Security (RLS) policies in Supabase

## Current Status

✅ App will no longer crash on startup
⚠️  Supabase features will not work until properly configured
✅ UI redesign is complete and functional
