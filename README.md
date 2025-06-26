# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Environment Variables

To run this project, you will need to add the following environment variables to your `.env` file.

### Firebase Configuration

You can get these values from your Firebase project settings under "Project settings" > "General".

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### User Access Control

This application uses a secure, invite-only system. To grant access to users, add their Google account emails to the `EMAIL_ALLOWLIST` variable. This should be a single, comma-separated string.

Example:
`EMAIL_ALLOWLIST="user1@gmail.com,user2@gmail.com,user3@gmail.com"`
