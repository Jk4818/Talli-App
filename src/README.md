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

This application uses a secure, invite-only system for account creation. To grant users the ability to sign up, add their email addresses to the `SIGNUP_ALLOWLIST` variable. This should be a single, comma-separated string of lowercase emails.

Example:
`SIGNUP_ALLOWLIST="user1@gmail.com,user2@gmail.com,user3@gmail.com"`
