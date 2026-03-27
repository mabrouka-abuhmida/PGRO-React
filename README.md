# PGR Matching System - Frontend

Frontend application for the PGR Matching System at University of South Wales.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **React Query (TanStack Query)** - Data fetching and caching
- **Axios** - HTTP client
- **React Hot Toast** - Toast notifications
- **Recharts** - Data visualization
- **React PDF** - PDF viewing

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running (see backend README)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your API URL:
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

Build the production bundle:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

The built files will be in the `dist/` directory.

## Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── contexts/        # React contexts (Auth, Staff)
│   ├── hooks/           # Custom React hooks
│   ├── layouts/         # Layout components
│   ├── pages/           # Page components
│   ├── services/       # API service layer
│   ├── styles/          # Global styles
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
├── public/              # Static assets
├── index.html           # HTML template
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies and scripts
```

## Key Features

- **Code Splitting**: Routes are lazy-loaded for optimal performance
- **Error Boundaries**: Catches and handles React errors gracefully
- **Toast Notifications**: User-friendly feedback for actions
- **Responsive Design**: Works on desktop and mobile devices
- **Type Safety**: Full TypeScript coverage
- **Accessibility**: ARIA labels and keyboard navigation support

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Execute tests cases using Jest
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint (allows up to 200 warnings)
- `npm run lint:strict` - Run ESLint with zero warnings

## Environment Variables

All environment variables must be prefixed with `VITE_` to be exposed to the client.

Required:
- `VITE_API_BASE_URL` - Backend API base URL

## Development Guidelines

### Code Quality

- Run `npm run lint` before committing
- Fix TypeScript errors before building
- Use TypeScript types instead of `any` where possible

### Component Structure

- Use functional components with hooks
- Keep components focused and reusable
- Extract logic into custom hooks when needed

### API Calls

- Use React Query hooks for data fetching
- Handle loading and error states
- Use mutations for create/update/delete operations

### Styling

- Use CSS modules or component-scoped CSS
- Follow the existing design system
- Ensure responsive design for mobile devices

## Production Deployment

1. Set `VITE_API_BASE_URL` to your production API URL
2. Run `npm run build`
3. Serve the `dist/` directory with a static file server (nginx, Apache, etc.)
4. Configure your server to:
   - Set security headers (CSP, X-Frame-Options, etc.)
   - Enable gzip compression
   - Set up proper caching headers

## Troubleshooting

### Build Errors

- Ensure all TypeScript errors are resolved
- Check that all environment variables are set
- Verify Node.js version is 18+

### Runtime Errors

- Check browser console for errors
- Verify API URL is correct
- Ensure backend API is running and accessible

## License

Copyright © University of South Wales

