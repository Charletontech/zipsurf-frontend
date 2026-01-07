### USER DASHBOARD

- User should be able to fund wallet (you will integrate paystack and payment method). we will have a wallet system
- when a user logs in to their dashboard and want to connect to our internet access points at any of our location where they currently are, they click on somewhere in their dashboard to get a list of all our locations (maybe a drop down or something) then they select the location they currently are at. then they are thrown a prompt that says "Do you want to request for the password for this internet access point? (You will be charged N1200 for this)." then if they click yes or proceed? then they are debited from their wallet and the password is displayed to them. The password is actually fetched from our backend (which we will build after the frontend is done). so it takes parameter of the location the user has selected, and gets the saved password for that location from the database and sends it to the user (this passwords for all locations are always changed on the backend at 11:59pm every day. Maybe a cron job or something will handle that, it generates a new passwords changes all the stored passwords for all locations ). there should also be a place in the dashboard where the user can view the password for the day (if they have actually paid to obtain it becos the payment they make is to access the password for only that day). if they didnt pay for that day it shows them "You have not paid for today's subscription" instead.
- User should be able to see transaction history (wallet funding, password purchase)
- There should be a dashboard overview section at the top showing the wallet balance and any other relevant information.

### STATION OFFICER REGISTRATION PAGE

- station officers will have separate page where they can register. the registration form will have the following fields: name of officer, phone, home address, Station of choice (it will be a dropdown having the list of all our locations where we have our routers, so they can chose where they want to be stationed at to work). when they successfully sign up, they will be shown the station code (not router password. this code will be fetched from our backend when we implement it. there will be a database of all locations/internet access points and their respective station codes) for that station. on that same page there will be a section for who have already registered and signed up to input their station code. once they put in their station code, it is sent to the database and verified correct. the system now detects which station the code is for, and then sends them the router password for that station so they can copy it.

### ADMIN DASHBOARD

- Admin should be able to see list of all users and their user data (wallet balance, name, email). Admin should also be able to directly update user balance just in case of payment issues/failure/errors.
- Admin should be able to see the list of all locations/internet access points an their router passwords and also their station codes (all fetched from database). Admin should be able to add a new location to the database (Station code for that location/internet access point is automatically generated on creation). Admin should have a button that when clicked automatically generates new passwords for all locations just in case the cron job fails.
- Admin should be able to see the list of all registered station officers and their registration data. the station code for the station the officer was assigned to should also show.
- Admin should have some sort of simple overview section at the top showing total amounts of credits that users have funded into the platform (maybe calculated from the transactions table in database)

### SOME BACKEND NOTES

- ...empty for now
