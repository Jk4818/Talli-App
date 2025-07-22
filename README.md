# Talli - Effortless Bill Splitting, Powered by AI

Talli is a modern, intelligent application designed to eliminate the friction from shared expenses. Stop arguing over the bill and let our AI-powered platform do the hard work. Just snap a photo of your receipt, assign items to your friends, and Talli will provide a penny-perfect breakdown of who owes what.

It's the perfect tool for dinners with friends, group trips, and any situation where you need to split costs fairly and accurately.

## Key Features

- **🤖 AI-Powered Receipt Scanning**: Snap a photo, and our AI will digitize every item, price, discount, and service charge in seconds.
- **🙋‍♀️ Intuitive Item Assignment**: Easily assign items to one or more people with a simple, visual interface. Talli supports equal, percentage, and exact amount splits.
- **💸 Penny-Perfect Settlements**: Our robust calculation engine handles complex splits, tips, and taxes to ensure everyone pays their exact share, down to the last penny.
- **📊 Insightful Summaries**: Get a clear, visual breakdown of who paid for what, and a simple settlement plan of who owes whom.
- **📄 Shareable Reports**: Generate a clean, print-friendly report of the entire bill split, complete with receipt images and itemized breakdowns, to share with your group.
- **🌍 Multi-Currency Support**: Handle bills in different currencies and settle up in a single, global currency of your choice.

## Technology Stack

Talli is built with a modern, scalable, and high-performance tech stack:

- **Framework**: [Next.js](https://nextjs.org/) with the App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI**: [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), and [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/)
- **Backend & Auth**: [Firebase](https://firebase.google.com/) (Authentication, Firestore, Storage)
- **Generative AI**: [Google's Genkit](https://firebase.google.com/docs/genkit) with the Gemini family of models.

## Local Development

### 1. Environment Variables

This project uses environment variables for configuration. For security, your secret keys should not be committed to version control.

1.  Create a new file in the root of the project named `.env.local`.
2.  Copy the contents of `.env.example` into your new `.env.local` file.
3.  Fill in the required values in `.env.local`.

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:9002`.

---

## Deployment to Vercel

This app is optimized for deployment on Vercel. Follow these steps for a production-ready setup.

### 1. Vercel Project Configuration

When you set up your project on Vercel, you will need to configure your Environment Variables in the Vercel project settings.

Go to your **Vercel Project > Settings > Environment Variables** and add the following:

#### Firebase Configuration
You can get these values from your Firebase project settings under "Project settings" > "General".

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

#### AI Functionality (Google AI)
To enable the AI receipt scanning features, you need to provide a Google AI API key.

- `GOOGLE_API_KEY`: Your API key for the Gemini family of models. You can get this from [Google AI Studio](https://aistudio.google.com/app/apikey).

#### Invite-Only Signup
This application uses a secure, invite-only system for account creation. To grant a user the ability to sign up, add their email address to the `EMAIL_ALLOWLIST` variable. This should be a single, comma-separated string of lowercase emails.

- `EMAIL_ALLOWLIST`: Example: `"user1@gmail.com,user2@gmail.com"`

If this variable is not set, **no one** will be able to create an account.

### 2. Firebase Console Configuration

For Firebase Authentication to work on your production site, you must add your Vercel domain to the list of authorized domains.

1.  Go to your **Firebase Console**.
2.  Navigate to **Authentication > Settings > Authorized domains**.
3.  Click **Add domain** and enter the domain Vercel assigns to your project (e.g., `your-app-name.vercel.app`).
4.  If you have a custom domain, add that as well.

### 3. Push to Deploy

Once your environment variables are set in Vercel and your domain is authorized in Firebase, simply push your code to your connected Git repository. Vercel will automatically build and deploy your application.
