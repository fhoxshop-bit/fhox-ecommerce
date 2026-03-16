# Email Configuration for FHOX Customer Messages

## Setup Instructions

To enable email replies from the admin panel, follow these steps:

### 1. Environment Variables Setup

Create a `.env` file in the backend directory with:

```
EMAIL_USER=your-gmail-email@gmail.com
EMAIL_PASS=your-app-specific-password
```

### 2. Getting Gmail App Password

1. Go to your **Google Account** (https://myaccount.google.com/)
2. Navigate to **Security** section
3. Enable **2-Step Verification** (if not already enabled)
4. Search for **App passwords**
5. Select "Mail" and "Windows Computer" (or your device)
6. Google will generate a 16-character password
7. Copy and paste this password as `EMAIL_PASS` in `.env`

### 3. Update Backend Dependencies

Run the following command in the backend directory:

```bash
npm install
```

This will install `nodemailer` which is required for sending emails.

### 4. MongoDB Setup

If you haven't set up MongoDB locally, install it:
- **Windows:** Download from https://www.mongodb.com/try/download/community
- **Mac:** `brew install mongodb-community`
- **Linux:** Follow official MongoDB installation guide

Start MongoDB service:
- **Windows:** `mongod`
- **Mac/Linux:** `brew services start mongodb-community`

### 5. How It Works

1. **Customer Message Submission:**
   - User fills out the contact form on `/connect` page
   - Message is saved to MongoDB database
   - Notification badge appears in admin panel

2. **Admin Reply Process:**
   - Admin navigates to "Customer Messages" page in admin panel
   - Views unread customer messages
   - Clicks on a message to read details
   - Types a reply and clicks "Send Reply"
   - Reply is automatically sent to customer's email
   - Message status changes to "replied"

3. **Customer Email:**
   - Customer receives professionally formatted email
   - Email contains their original message and admin's reply
   - Email comes from your configured Gmail address

## Important Notes

- Keep your `.env` file private and never commit it to version control
- Gmail's app passwords provide secure access without exposing your main password
- For production, consider using a dedicated email service like SendGrid or AWS SES
- MongoDB must be running for the application to work
- Ensure your firewall allows port 27017 for MongoDB

## Testing

To test locally:
1. Start MongoDB: `mongod`
2. Start Backend: `npm run dev` (in backend directory)
3. Start Frontend: `npm run dev` (in main directory)
4. Fill out contact form on `/connect`
5. Check admin panel notification badge
6. Reply to message from admin panel
7. Check customer email for reply