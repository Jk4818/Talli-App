# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Environment Variables

This project uses environment variables for configuration. For security, your secret keys should not be committed to version control.

1.  Create a new file in the root of the project named `.env.local`.
2.  Copy the contents of `.env.example` into your new `.env.local` file.
3.  Fill in the required values in `.env.local`.

### Firebase Configuration

You can get these values from your Firebase project settings under "Project settings" > "General".

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Invite-Only Signup

This application uses a secure, invite-only system for account creation. To grant a user the ability to sign up, add their email address to the `EMAIL_ALLOWLIST` variable in your `.env.local` file. This should be a single, comma-separated string of lowercase emails.

If this variable is not set, **no one** will be able to create an account.

**Example:**
`EMAIL_ALLOWLIST="user1@gmail.com,user2@gmail.com,user3@gmail.com"`
