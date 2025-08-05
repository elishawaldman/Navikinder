# Project Requirements Document

## 1. Project Overview

We are building a pediatric medication tracker web app that helps parents of children with complex chronic illnesses keep a clear, up-to-date record of all their child’s medicines. Caregivers can manage both scheduled medications (taken at set times) and PRN (“as-needed”) doses in one place. The app will support manual entry, photo-based label scanning (OCR), dose logging, medication history review, and PDF export. It will be mobile-first, cleanly designed, and easy for non-technical users to pick up.

This MVP (minimum viable product) is being built to solve the problem of fragmented or missing medication records—a real risk when multiple drugs and schedules are involved. Success will be measured by caregivers’ ability to add and track medicines, receive reminders on time, review history, and export accurate reports. Early usability testing should confirm that new users can complete core tasks (add a med, log a dose, view history) in under 2 minutes each.

## 2. In-Scope vs. Out-of-Scope

**In-Scope (MVP)**

*   Child profile management (multiple children under one account)
*   Medication Overview Page for each child
*   Manual entry of scheduled medications with custom recurrence
*   PRN (“as-needed”) dose entry
*   Photo upload + OCR extraction (Google Cloud Vision API)
*   Medication history log with date/time/status/reason
*   Export history as simple PDF (header, footer, key fields)
*   In-app, email, and SMS reminders for scheduled meds
*   Mobile-first, responsive UI with neutral color scheme

**Out-of-Scope (Later Phases)**

*   Offline mode
*   Role-based permissions and multi-caregiver editing (designed for future)
*   Advanced HIPAA or other compliance certifications
*   Custom branding assets (logo, custom fonts)
*   Monetization or subscription management
*   Multi-language or localization support

## 3. User Flow

When a caregiver first logs in, they see a list of their children’s profiles. They can tap an existing child or add a new one. After selecting a child, they land on the Medication Overview Page which shows two sections: Scheduled meds and PRN meds. Each med appears as a simple card with name, next dose time, and quick actions like “Log Dose” or “Stop.”

From the overview page, caregivers can:

1.  Tap “Add New Medication” → go to a form for scheduled meds (name, dose, custom schedule, start date).
2.  Tap “Upload Photo” → go to OCR page, snap or upload a label, review extracted fields, save.
3.  Log a PRN dose inline or via a dedicated form (name, dose, date/time, reason).
4.  View full history → goes to Medication History Page (chronological list with export PDF button).
5.  Manage reminders in settings (email/SMS/in-app).

## 4. Core Features

*   **Child Profile Management**\
    Multiple child profiles per account; each profile has its own medication lists.
*   **Medication Overview Page**\
    Two clear sections (Scheduled / PRN); cards show next due, status, and quick actions.
*   **New Medication Entry**\
    Form fields: name, dose amount, custom recurrence (every X hours or specific weekdays), start date/time.
*   **PRN Medication Entry**\
    Form fields: name, dose, date/time, reason for administration.
*   **Photo Upload & OCR**\
    Upload or take a photo of medication label; extract name, strength, instructions via Google Cloud Vision API; editable before saving.
*   **Medication History & PDF Export**\
    Chronological log of doses (given, skipped, reasons); export as simple PDF with header (app name), footer (export date), and core fields.
*   **Reminders & Notifications**\
    In-app alerts and optionally email/SMS for scheduled doses; options to snooze or dismiss.
*   **Responsive Mobile-First UI**\
    Clean typography, neutral background, blue/gray buttons, intuitive forms.

## 5. Tech Stack & Tools

*   Frontend: React + Next.js (server-rendered React framework)

*   Backend & Auth: Supabase (PostgreSQL database, user authentication, storage)

*   OCR Service: Google Cloud Vision API (text extraction from images)

*   Hosting: Vercel (for Next.js deployment, CDN)

*   IDE & AI Coding Tools:

    *   Cursor (AI-powered code suggestions in the editor)
    *   Lovable.dev (AI to scaffold front-end components and full-stack boilerplate)

## 6. Non-Functional Requirements

*   Performance:

    *   Page load under 2 seconds on 4G mobile.
    *   OCR processing under 5 seconds per image upload.

*   Security & Privacy:

    *   All API calls over HTTPS.
    *   Passwords hashed via Supabase Auth.
    *   Data access only via authenticated sessions.

*   Usability:

    *   Core tasks completable within 2 minutes.
    *   Buttons at least 44×44 px (mobile tap target standard).

*   Availability:

    *   99.5% uptime SLA on Vercel + Supabase.

## 7. Constraints & Assumptions

*   No offline capability for MVP; always-online assumption.
*   Google Cloud Vision API quotas and billing apply.
*   Email/SMS reminder delivery relies on third-party (e.g., SendGrid, Twilio).
*   No HIPAA compliance required at launch.
*   Future multi-caregiver access will use Supabase row-level security but is not active in MVP.

## 8. Known Issues & Potential Pitfalls

*   **OCR Accuracy**: Variations in label photos may cause misreads.\
    *Mitigation*: Always show extracted fields for user review/edit before saving.
*   **Notification Delays**: Email/SMS may be delayed by provider.\
    *Mitigation*: Show in-app reminders as primary alert; allow manual snooze.
*   **Rate Limits**: Google Vision or SMS API quotas.\
    *Mitigation*: Cache OCR results, batch notifications, monitor usage.
*   **Data Consistency**: Race conditions if two devices update same child simultaneously.\
    *Mitigation*: Use Supabase real-time subscriptions and simple conflict handling (last write wins, with logs).

This document is designed to guide the AI in generating all subsequent technical and design artifacts—tech stack docs, frontend guidelines, backend structure—without missing details or assumptions.
