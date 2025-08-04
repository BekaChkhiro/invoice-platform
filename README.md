# Invoice Platform

Modern invoice management system built with Next.js 14, TypeScript, and Supabase.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript** 
- **Tailwind CSS**
- **Supabase** (Database & Auth)
- **Shadcn/ui** (UI Components)
- **React Hook Form** (Form Management)
- **Zod** (Schema Validation)
- **Zustand** (State Management)
- **TanStack Query** (Data Fetching)

## Features

- 🔐 Authentication (Login, Register, Password Reset)
- 📊 Dashboard with Analytics
- 📄 Invoice Management
- 👥 Client Management
- ⚙️ Settings & Configuration
- 📱 Responsive Design
- 🌙 Dark Mode Support

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm/yarn
- Supabase Account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd invoice-platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Update `.env.local` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router
├── components/             # Reusable UI components
├── lib/                    # Utilities and configurations
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript type definitions
└── styles/                 # Global styles and fonts
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

This project is licensed under the MIT License.