/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// Configure nodemailer with your email service (e.g., Gmail)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.pass
  }
});

exports.sendOrderConfirmation = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const { to, meal } = data;
  const pickupTime = new Date(meal.pickupTime);

  const mailOptions = {
    from: functions.config().email.user,
    to,
    subject: `Order Confirmation - ${meal.title}`,
    html: `
      <h1>Order Confirmation</h1>
      <p>Thank you for ordering ${meal.title}!</p>
      
      <h2>Order Details:</h2>
      <ul>
        <li><strong>Pickup Time:</strong> ${pickupTime.toLocaleString()}</li>
        <li><strong>Price:</strong> Rs. ${meal.price}</li>
        <li><strong>Food Items:</strong> ${meal.foodItems.join(", ")}</li>
      </ul>

      <p>We'll send you a reminder 15 minutes before pickup time.</p>
      
      <p>Enjoy your meal! 🍽️</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    throw new functions.https.HttpsError("internal", "Failed to send confirmation email");
  }
});

exports.schedulePickupReminder = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const { to, meal } = data;
  const pickupTime = new Date(meal.pickupTime);
  const reminderTime = new Date(pickupTime.getTime() - 15 * 60000); // 15 minutes before pickup

  // Schedule the reminder using Cloud Tasks or Pub/Sub
  await admin.firestore().collection("scheduledReminders").add({
    to,
    meal,
    reminderTime,
    sent: false
  });

  return { success: true };
});

// Function to check and send scheduled reminders (runs every minute)
exports.sendScheduledReminders = functions.pubsub.schedule("every 1 minutes").onRun(async () => {
  const now = new Date();
  const remindersRef = admin.firestore().collection("scheduledReminders");
  
  const query = remindersRef
    .where("sent", "==", false)
    .where("reminderTime", "<=", now);

  const reminders = await query.get();

  for (const doc of reminders.docs) {
    const reminder = doc.data();
    const pickupTime = new Date(reminder.meal.pickupTime);

    const mailOptions = {
      from: functions.config().email.user,
      to: reminder.to,
      subject: `Pickup Reminder - ${reminder.meal.title}`,
      html: `
        <h1>Pickup Reminder</h1>
        <p>Your order of ${reminder.meal.title} is ready for pickup in 15 minutes!</p>
        
        <h2>Pickup Details:</h2>
        <ul>
          <li><strong>Pickup Time:</strong> ${pickupTime.toLocaleString()}</li>
          <li><strong>Food Items:</strong> ${reminder.meal.foodItems.join(", ")}</li>
        </ul>

        <p>Don't be late! Your delicious meal awaits! 🚀</p>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      await doc.ref.update({ sent: true });
    } catch (error) {
      console.error("Error sending reminder email:", error);
    }
  }
});
