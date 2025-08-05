# App Flow Document

## Onboarding and Sign-In/Sign-Up

When a new user first arrives at the web app, they land on a simple welcome page that introduces the pediatric medication tracker. This page offers two clear buttons labeled “Sign Up” and “Sign In.” A user who has never created an account clicks the Sign Up button and is taken to a form where they enter their email address, choose a secure password, and confirm the password. After agreeing to the terms of service, they tap a Create Account button. The system then sends a confirmation email to the address provided. Once the user clicks the link in that email, their account is activated and they are automatically guided to the next step.

If an existing user clicks Sign In on the welcome page, they see a login form requesting email and password. Entering correct credentials logs them into the app and takes them to the child profile selection screen. If the user cannot recall their password, they click a Forgot Password link below the form. This brings up a screen where they enter their email. The app sends a password reset link by email. When the user follows that link, they can create a new password and then return to the Sign In form. Once logged in, every page in the app shows a consistent header with the user’s name and a Sign Out link. Tapping Sign Out immediately logs the user out and returns them to the welcome page.

## Main Dashboard or Home Page

After signing in or completing confirmation, users arrive first at the child profile selection page. Here they see a list of the children they are tracking, each shown as a simple card with the child’s name and age. At the end of the list there is an Add New Child button. Tapping that button opens a small form where the caregiver enters the child’s name, date of birth, and optional notes. Saving the child profile returns them to the profile selection screen, where the new card now appears. Choosing any child card moves the user into that child’s Medication Overview Page.

The Medication Overview Page is the primary dashboard for daily use. It is split visually into two sections labeled Scheduled Medications and PRN (As-Needed) Medications. Each medication is represented by a clean card showing its name, dose, next scheduled time or a button to Log Dose, and quick controls to edit or stop the medication. A fixed bottom navigation bar gives access to child switch, notifications, the overview page itself, and settings. From here, caregivers can quickly see upcoming doses at the top of the screen, and scroll down to find as-needed medications.

## Detailed Feature Flows and Page Transitions

### New Medication Entry Page

From the Medication Overview Page, the caregiver taps an Add New Medication button in the Scheduled section. This brings up the New Medication Entry Page, which displays a form asking for the medication name, dosage amount, and a custom frequency pattern. Frequency options allow entries such as every X hours or specific days of the week. The caregiver also picks a start date and time using a date picker and time selector. After reviewing the entered details, they tap Save. The app validates the inputs, creates the new scheduled medication record in the database, and then automatically returns the caregiver to the Medication Overview Page, where the new medication appears in the scheduled list.

### PRN Medication Entry Page

When the caregiver needs to log a dose of an as-needed medication, they tap the Log Dose control on a PRN med card. This opens the PRN Medication Entry Page. There a brief form prompts them to enter the dose amount, the date and time (defaulted to now but editable), and a short reason for giving the medication. After tapping Save, the app records the dose immediately, shows a quick confirmation message, and returns them to the Medication Overview Page. The PRN section now reflects the new dose entry alongside previous entries.

### Upload and OCR Page

On the Medication Overview Page, a user may tap Upload Photo instead of manual entry. This leads to the Upload and OCR Page, where the caregiver can use their phone camera or select an image from their gallery. Once an image is chosen, the app sends it to the Google Cloud Vision API and displays a loading spinner. When the OCR results arrive, the page shows editable text fields for medication name, strength, dosage instructions, and frequency. The caregiver reviews and adjusts any fields as needed, then taps Save. The validated medication is added to the scheduled or PRN list depending on the type, and the user is taken back to the Medication Overview Page.

### Medication History Page

To view past doses, the caregiver taps a History icon on any medication card or uses a global History button in the header. This opens the Medication History Page. Here they see a full chronological log of all doses for that child, both scheduled and PRN. Each row shows date, time, dose amount, whether it was given or skipped, and any reason provided. At the top right, an Export to PDF button appears. Tapping it generates a simple report with the app’s name in the header, the export date in the footer, and columns for medication name, dose, date/time, and status. Once generated, the PDF is offered for download or share via the device’s share sheet.

### Reminder and Notification Flow

When a scheduled medication is created or edited, the system schedules reminders in three ways. In-app reminders trigger a notification banner inside the app at the dose time, where the caregiver can Dismiss or Snooze. Email reminders are sent via a configured email service at the scheduled time. SMS reminders go out through an SMS gateway. The caregiver can customize their notification preferences in Settings, enabling or disabling email and SMS, adjusting lead time, or turning off snooze.

## Settings and Account Management

The Settings page is accessible via the bottom navigation. It shows the user’s account email at the top, with an Edit Profile button that opens a form to change email and password. Below that, a Notifications section lists toggles for in-app, email, and SMS reminders, and a field to adjust how many minutes before a scheduled dose the notifications fire. Further down, a Children section lists all existing child profiles with Edit and Delete controls. Tapping Edit on a child opens the same form as Add New Child, pre-filled. Deleting a child prompts a confirmation before removing all associated medications and history. At the bottom of Settings, there is a Sign Out button that logs the user out of the app and returns them to the welcome page.

## Error States and Alternate Paths

If the user enters invalid data anywhere, such as leaving a required field blank or entering an impossible dose amount, the form highlights the field in red and shows a short explanatory message. During OCR processing, if the image is unreadable or the API call fails, the app displays an error message with a Retry button and a Cancel link. If the user loses internet connectivity, a banner appears at the top of the screen reading “Offline mode: some features may be unavailable.” Any attempt to save data while offline triggers a brief error toast explaining the failure and suggesting the user try again once they are back online. For protected pages, if the session expires, the user is redirected to the Sign In page with a note that they need to sign in again.

## Conclusion and Overall App Journey

The typical user journey begins with signing up or signing in, selecting one of their children or adding a new profile, and landing on the Medication Overview Page. From there, caregivers can quickly add new meds by typing in or using OCR, log PRN doses, and view a complete history. Scheduled medications automatically generate reminders in-app, by email, and by SMS according to the caregiver’s settings. If anything goes wrong, clear error messages guide the user back to a smooth flow. Finally, caregivers can manage their account details, notification preferences, and child profiles in Settings, then sign out when finished. Throughout this journey, the app remains clean, mobile-friendly, and focused on helping caregivers track all medications reliably and easily.
