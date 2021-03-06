// Twilio API, Send incoming notifications as text message

require('dotenv').config();

const Notifications = require('../database/Helpers/notifications-model');
const twilio = require('twilio');

// Get an instance of `PhoneNumberUtil`.
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_TOKEN;

async function sendTextNotifications(notification) {
  // phone validation to prevent empty numbers from progressing the function
  if (notification.phoneNumber === "") {
    await Notifications.markNotificationAsSent(notification.notificationID, {
      textOn: 0,
      textSent: 1
    });
    console.log('Empty phone number found, mark as inactive')
  }

  // run logic to check which texts need to be sent
  else if (notification.textSent === 0 && notification.textOn === 1) {
    console.log(notification.phoneNumber, "text active, continue running send function")
    try {
      const client = new twilio(accountSid, authToken);

      // use notification.userID to get user's current notification account and their account type's max count
      const userCountData = await Notifications.getUserNotificationCountData(
        notification.userID
      );

      if (userCountData.notificationCount === userCountData.maxNotificationCount) {
        console.log('User has reached maximum notification this month')
      }

      // compare User.notificationCount to accountType.maxNotificationCount
      else if (userCountData.notificationCount < userCountData.maxNotificationCount) {

        // if less than, continue sending messages and increase notification count by 1
        let newValue = (await userCountData.notificationCount) + 1;

        // Create options to send the message
        const options = {
          to: notification.phoneNumber,
          from: process.env.TWILIO_NUMBER,
          body: `${notification.postName}  ${notification.postDetails} Read more: ${
            notification.link
            }`
        };

        // Parse number with country code and keep raw input.
        const number = await phoneUtil.parseAndKeepRawInput(notification.phoneNumber, 'US');

        // Send the message!
        if ((phoneUtil.isValidNumberForRegion(number, 'US'))) {
          await client.messages.create(options, function (err, response) {
            if (err) {
              console.error(err);
            } else {
              // Hide the last few digits of a phone number
              let masked = options.to.substr(0, options.to.length - 5);
              masked += '*****';
              console.log(`Message sent to ${masked}`);
            }
          });

          // send updated notificationCount to the database
          await Notifications.increaseUserNotificationCount(
            notification.userID,
            newValue
          );

          await Notifications.markNotificationAsSent(notification.notificationID, {
            textSent: 1
          });
        } else {
          console.log(notification.phoneNumber, 'is not valid, skipping invalid phone number')
          // if phone number is not valid, deactivate and mark as sent (temporary logic to ensure it doesn't keep trying to send this)
          await Notifications.markNotificationAsSent(notification.notificationID, {
            textOn: 0,
            textSent: 1
          });
        }
      } else {
        console.log("Maximum notification count has been reached for this user")
      }
    } catch (error) {
      console.log('text notification function error', error)
    }
  } else {
    console.log("text marked as inactive or already marked as sent")
  }
}

module.exports = sendTextNotifications;
