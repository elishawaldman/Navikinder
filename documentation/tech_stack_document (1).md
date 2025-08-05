# Tech Stack Document

This document explains, in everyday language, the technology choices for our pediatric medication tracker web app. It covers how each piece of the stack works together to deliver a clean, mobile-friendly, and reliable experience for caregivers.

## Frontend Technologies

We chose the following tools to build the user interface you see and interact with in your browser or on your phone:

*   **React**\
    A popular JavaScript library that lets us build the app in small, reusable pieces (called components). This helps keep the code organized and makes it easy to update or add features later.
*   **Next.js**\
    A framework built on top of React that gives us: • Fast page loading by pre-rendering pages on the server or at build time.\
    • Simple file-based routing—each file in the `pages/` folder becomes a URL.\
    • Built-in support for CSS Modules, so we can write clean, scoped styles without extra setup.
*   **CSS Modules & Responsive Layout**\
    We use plain CSS files scoped to each component (via CSS Modules) and modern layout techniques (Flexbox and Grid) to: • Ensure consistent spacing, typography, and color schemes.\
    • Build a mobile-first, responsive design that adapts gracefully to any screen size.
*   **React Hooks**\
    Built-in React features like `useState` and `useEffect` make it straightforward to manage form inputs, loading states, and side effects (such as fetching data).

Together, these frontend choices give us an interface that:

• Loads quickly—even on slower connections.\
• Feels snappy and interactive.\
• Is easy to maintain, test, and extend in future releases.

## Backend Technologies

On the server side, we rely on Supabase to handle data storage, authentication, and file handling:

*   **Supabase (PostgreSQL Database)**\
    Our main data store for: • Child profiles, medications, dose logs, and history.\
    • Custom recurrence patterns and notification schedules.\
    • Role-based access rules (planned for future phases).
*   **Supabase Auth**\
    A secure, ready-made system for: • User registration and login (email/password).\
    • Managing sessions and JSON Web Tokens (JWTs) so each caregiver sees only their own data.
*   **Supabase Storage**\
    A built-in solution to store and serve uploaded photos of medication labels.\
    We keep images here and link them to the relevant medication records.
*   **Database Triggers & Edge Functions** (leveraging Supabase tools)\
    • To schedule and send reminders for due medications.\
    • To run cleanup tasks or generate simple reports on demand.

By using Supabase, we get a fully hosted backend without spinning up or maintaining servers ourselves. It ties together database, auth, storage, and serverless functions under one roof.

## Infrastructure and Deployment

Here’s how we host and deliver the app so it’s always up-to-date and reliable:

*   **Version Control (Git & GitHub)**\
    We store all code in a GitHub repository, using branches to develop new features and pull requests to review changes before merging.
*   **Hosting & CI/CD with Vercel**\
    Vercel integrates directly with our GitHub repo to: • Automatically build and deploy preview versions for every pull request.\
    • Deploy the main branch to production when merges occur.\
    • Provide a global Content Delivery Network (CDN) so pages and assets load quickly anywhere.
*   **Environment Management**\
    Vercel’s dashboard securely stores API keys and connection strings (for Supabase, Google Vision API, Twilio, etc.), keeping secrets out of the codebase.

This setup means:

• New features and bug fixes go live automatically once approved.\
• We can roll back to a previous version quickly if needed.\
• Our app remains highly available and scalable under load.

## Third-Party Integrations

To deliver specialized functionality without reinventing the wheel, we integrate a few key services:

*   **Google Cloud Vision API**\
    Handles OCR (text extraction) from photos of medication labels. Caregivers upload or snap a picture, and Vision returns the text for easy review and saving.
*   **SendGrid (or similar)**\
    Sends email reminders for scheduled medications. We’ll plug in a reliable email provider to handle large volumes and ensure deliverability.
*   **Twilio (or similar)**\
    Sends SMS reminders when caregivers opt in. Twilio’s APIs make it simple to send texts and track their delivery status.
*   **PDF Generation Library (pdf-lib or PDFKit)**\
    Produces the simple PDF reports for medication history exports. We’ll run this on a Next.js API route so caregivers can download or share their PDF in one click.

Each integration is encapsulated behind a clear interface, so if we switch providers later, the rest of the app remains unaffected.

## Security and Performance Considerations

We’ve baked in measures to keep data safe and the app fast:

*   **Secure Connections**\
    All API calls and page loads use HTTPS by default.
*   **Authentication & Access Control**\
    Supabase Auth issues JWTs for each session. Row-Level Security policies in PostgreSQL ensure users only read and write their own child and medication data.
*   **Data Encryption**\
    Supabase encrypts data at rest, and Vercel serves assets over a global CDN with built-in SSL.
*   **Input Validation & Sanitization**\
    We check and clean any user inputs (forms or OCR results) to prevent injection attacks.
*   **Performance Optimizations**\
    • Next.js static generation and server-side rendering for critical pages.\
    • CDN caching of assets and pages.\
    • Code splitting and lazy loading of heavy components (like the OCR upload tool).
*   **Monitoring & Alerts**\
    We’ll set up basic uptime and error monitoring (via Vercel or third-party tools) to catch and address issues quickly.

## Conclusion and Overall Tech Stack Summary

Our pediatric medication tracker leverages a modern, proven set of tools to deliver a fast, secure, and user-friendly experience:

*   Frontend: **React + Next.js** with CSS Modules for clarity and performance.
*   Backend: **Supabase** for database, authentication, storage, and serverless functions—no server maintenance required.
*   Infrastructure: **GitHub + Vercel** for seamless version control, automated builds, and global hosting.
*   Integrations: **Google Cloud Vision** for OCR, **SendGrid/Twilio** for reminders, and a **PDF library** for easy exports.
*   Security & Performance: HTTPS, JWT auth, database policies, CDN caching, and code optimizations.

These choices align perfectly with our goals: a clean, mobile-first design that lets caregivers add medications, log doses, receive reminders, and export history—reliably and securely—without any technical friction.
