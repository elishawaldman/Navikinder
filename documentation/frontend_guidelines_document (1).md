# Frontend Guideline Document

This document outlines the frontend architecture, design principles, and technologies used in our pediatric medication tracker web app. It’s written in clear, everyday language so that anyone—technical or not—can understand how our frontend is set up and why.

## 1. Frontend Architecture

### Frameworks and Libraries

*   **Next.js**: Provides the base for our React application, handling routing, server-side rendering (SSR), and static site generation (SSG) out of the box.
*   **React**: Powers our user interfaces through reusable components.
*   **Tailwind CSS**: A utility-first CSS framework that lets us style components quickly with pre-defined classes.
*   **Supabase JavaScript Client**: Manages data fetching, authentication, and storage interactions.
*   **Google Cloud Vision API**: Handles OCR extraction on the upload page.

### How It Supports Scalability, Maintainability, and Performance

*   **Modular Components**: Building with React components keeps code organized.
*   **File-Based Routing**: Next.js auto-generates routes from files in the `/pages` folder—easy to add or remove pages.
*   **Incremental Static Regeneration (ISR)**: Balances fresh data with fast page loads.
*   **Built-In Code Splitting**: Next.js only sends the code each page needs, improving load times.
*   **Tailwind’s Utility Classes**: Avoids custom CSS bloat; we only ship the classes we use.

## 2. Design Principles

We follow these key principles throughout the app:

*   **Usability**: Interfaces are straightforward. Labels and buttons are clear. Error messages explain what went wrong and how to fix it.
*   **Accessibility**: We use semantic HTML, proper ARIA attributes, and keyboard-navigable components so everyone can use the app.
*   **Responsiveness**: Mobile-first design ensures the app works smoothly on phones and tablets. Layouts adapt to any screen size.
*   **Consistency**: Components, colors, and typography stay uniform across pages to reduce confusion.

How We Apply Them:

*   All forms have visible labels and validation messages.
*   Color contrasts meet WCAG 2.1 AA standards.
*   Breakpoints at 640px, 768px, 1024px, and 1280px to adjust layouts.
*   Shared header, footer, and navigation components ensure the same look and feel.

## 3. Styling and Theming

### Styling Approach

*   **Tailwind CSS** for rapid, utility-based styling.
*   **PostCSS** with PurgeCSS integrated via Next.js to remove unused CSS in production.

### Theming

*   We maintain a single, neutral theme with light and dark variants (future enhancement).
*   Theme values (colors, spacing, breakpoints) live in `tailwind.config.js` so everything stays consistent.

### Visual Style

*   **Modern Flat Design**: Simple shapes, minimal shadows, clear hierarchy.
*   **Neutral Color Palette** (example): • Primary Blue: #3B82F6\
    • Secondary Gray: #6B7280\
    • Accent Green: #10B981\
    • Background Light: #F9FAFB\
    • Background Dark: #1F2937\
    • Error Red: #EF4444

### Typography

*   **Font Family**: Inter (sans-serif) for a clean, legible look.
*   **Font Sizes**: Scaled from `text-sm` (14px) up to `text-2xl` (24px) based on importance.

## 4. Component Structure

### Organization

`/src /components # Reusable UI pieces (buttons, forms, cards) /layouts # Page wrappers (Header, Footer, SideNav) /pages # Next.js pages (index.js, /children/[id].js) /hooks # Custom React hooks (useAuth, useMedicines) /utils # Helper functions (date formatting, PDF generation) /styles # Global styles (if any), Tailwind config`

### Reuse and Consistency

*   Each component lives in its own folder with a `.jsx` and a `.module.css` (when needed).
*   We follow atomic design: atoms (buttons), molecules (form fields), organisms (medication cards).

### Why Component-Based Architecture Matters

*   **Maintainability**: Fixing a bug in one button updates all buttons across the app.
*   **Scalability**: New features often become new components or compose existing ones.

## 5. State Management

### Approach and Libraries

*   **React Context & Hooks** for lightweight global state (e.g., user session, theme).
*   **SWR** (Stale-While-Revalidate) for data fetching and caching with Supabase, providing real-time UI updates when data changes.

### How State Is Shared

*   We wrap the app in `AuthProvider` (Context) to track the signed-in user.
*   `useMedicines` hook uses SWR to fetch, cache, and mutate the list of medications for each child.

## 6. Routing and Navigation

### Routing Library

*   **Next.js Router**: File-based routing. Dynamic routes for child IDs and medication IDs.

### Navigation Structure

*   **Top Navigation Bar** (on mobile: bottom tab bar): Home, Children, Upload, Settings.
*   **Side Menu** (on tablet/desktop): Links to child profiles, medication overview, history, OCR page.

Users tap or click menu items to move between pages. Next.js prefetches linked pages in the background for instant loading.

## 7. Performance Optimization

### Strategies

*   **Code Splitting**: Next.js automatically splits code by page.
*   **Lazy Loading**: Components like PDF viewer or large charts load only when needed (`next/dynamic`).
*   **Image Optimization**: Use `next/image` for responsive, compressed images.
*   **Asset Compression**: Brotli/Gzip compression on Vercel.
*   **Caching**: Leverage browser caching and SWR’s built-in caching.

How This Helps Users

*   Faster page loads, even on slow connections.
*   Reduced data usage—critical for busy caregivers on mobile.

## 8. Testing and Quality Assurance

### Testing Strategies

*   **Unit Tests** for individual components and helpers.
*   **Integration Tests** to verify form flows and API interactions.
*   **End-to-End (E2E) Tests** to simulate real user flows (sign in, add medication, view history).

### Tools and Frameworks

*   **Jest** with **React Testing Library** for unit and integration tests.
*   **Cypress** for E2E tests—runs in a real browser to catch UI regressions.
*   **ESLint** and **Prettier** to enforce code style and catch errors before commit.

## 9. Conclusion and Overall Frontend Summary

Our frontend setup, built on Next.js and React, emphasizes speed, clarity, and ease of use. By following component-based architecture, utility-first styling, and a mobile-first mindset, we:

*   Deliver a responsive, accessible experience for caregivers on the go.
*   Keep styles consistent with Tailwind’s theme system and Inter font.
*   Manage data seamlessly with Supabase and SWR, ensuring real-time updates.
*   Optimize performance through code splitting, lazy loading, and image compression.
*   Maintain high quality with thorough testing (Jest, React Testing Library, Cypress).

This approach aligns perfectly with our goal: a simple, reliable pediatric medication tracker that parents and caregivers can trust every day. If you have any questions or need clarification, this guide should point you in the right direction. Good luck building!
