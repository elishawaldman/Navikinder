# Navikinder

A comprehensive medication tracking application designed to help parents and caregivers manage their child's medications with reminders, dosage tracking, and medication history.

## Features

- 📱 **Medication Management**: Add, edit, and track medications with detailed dosage information
- ⏰ **Smart Reminders**: Automated push notifications for medication schedules
- 📊 **Dose Tracking**: Track taken, missed, and PRN (as-needed) doses
- 📈 **History & Analytics**: View medication history and adherence patterns
- 🔒 **Secure & Private**: Built with security-first approach using Supabase
- 📱 **PWA Support**: Works offline and can be installed as a mobile app

### Push Notification System

The application includes a comprehensive push notification system that has been implemented with:
- **Browser Compatibility**: Supports modern browsers with service worker integration
- **iOS Support**: Special handling for iOS devices with PWA installation detection
- **Testing Tools**: Built-in notification testing functionality for debugging
- **Supabase Integration**: Backend edge functions for sending notifications

*Note: The push notification setup card on the overview page is currently commented out but can be re-enabled by uncommenting the code in `src/components/PushNotificationSetup.tsx` if you want to test the functionality.*

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Framework**: Vite for fast development and building
- **Styling**: Tailwind CSS with shadcn/ui components
- **Backend**: Supabase for database and authentication
- **Deployment**: Vercel-ready configuration
- **PWA**: Service worker integration for offline functionality

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd navikinder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env.local`
   - Add your Supabase project URL and anon key
   - Configure any additional environment variables

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000` to see the application

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components and routing
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
├── lib/                # Utility functions and configurations
└── main.tsx           # Application entry point
```

## Deployment

This application is optimized for deployment on Vercel:

1. **Connect your repository** to Vercel
2. **Configure environment variables** in the Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy your application

The application includes:
- Automatic PWA generation
- Service worker for offline functionality
- Optimized build configuration for Vercel

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security

- All user data is encrypted and stored securely using Supabase
- Authentication is handled through Supabase Auth
- API endpoints include rate limiting and security measures
- Regular security audits and updates

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions, please open an issue in the repository or contact the development team.