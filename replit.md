# DuoLove - Telegram WebApp for Couples Games

## Overview

DuoLove is a Telegram WebApp designed for couples, friends, and family members to connect and play interactive games together. The application allows two people to add each other as partners and engage in various mini-games, challenges, and quests to strengthen their relationship and have fun together online.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development practices
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Framework**: Tailwind CSS with shadcn/ui component library for consistent design
- **Styling**: CSS custom properties with dark mode support
- **State Management**: React hooks for local state, TanStack Query for server state
- **Routing**: Wouter for lightweight client-side routing
- **Telegram Integration**: Direct Telegram WebApp API integration for native platform features

### Backend Architecture
- **Server Framework**: Express.js with TypeScript for API endpoints (currently minimal)
- **Database Strategy**: Client-side SQLite using sql.js for local data storage
- **Data Persistence**: LocalStorage as backup for SQLite database
- **Session Management**: In-memory storage implementation with extensible interface
- **API Design**: RESTful endpoints with `/api` prefix (prepared for future expansion)

### Data Storage Solutions
- **Primary Database**: SQLite via sql.js running in the browser
- **Backup Storage**: Browser LocalStorage for data persistence
- **Schema Management**: Drizzle ORM with PostgreSQL dialect (ready for server migration)
- **Database Features**: Local CRUD operations, game session tracking, achievement system

## Key Components

### User Management
- **User Profiles**: Telegram user integration with profile data
- **Partner System**: One-to-one partner connections via invite links
- **Authentication**: Telegram WebApp authentication (no separate login required)

### Game System
- **Game Types**: Knowledge tests, reaction games, paired quests, daily challenges, truth-or-dare
- **Session Management**: Game state tracking, scoring system, completion status
- **Progress Tracking**: Game history, achievements, statistics

### UI Components
- **Navigation**: Bottom tab navigation with haptic feedback
- **Game Cards**: Categorized game selection with visual indicators
- **Responsive Design**: Mobile-first approach optimized for Telegram WebApp
- **Theme Support**: Light/dark mode following Telegram app theme

### Telegram Integration
- **WebApp API**: Full integration with Telegram WebApp features
- **Haptic Feedback**: Touch feedback for enhanced user experience
- **Main Button**: Context-aware primary action button
- **Back Button**: Navigation support with Telegram's back button
- **Theme Integration**: Automatic theme switching based on Telegram settings

## Data Flow

### User Onboarding
1. User opens app via Telegram WebApp
2. App extracts user data from Telegram WebApp API
3. Local SQLite database is initialized
4. User profile is created or retrieved from local storage

### Partner Connection
1. User generates invite link with unique identifier
2. Partner opens link, triggering partner invitation flow
3. Both users are connected in local databases
4. Partner relationship is established for game access

### Game Sessions
1. User selects game from categorized list
2. Game session is created in local database
3. Game state is managed locally with periodic saves
4. Results are stored upon completion with scoring data

### Data Synchronization
- **Current**: All data stored locally per user
- **Future Ready**: Database schema prepared for server-side synchronization

## External Dependencies

### Core Dependencies
- **React Ecosystem**: React, React DOM for UI framework
- **TypeScript**: Type safety and development tooling
- **Vite**: Build tool and development server
- **Tailwind CSS**: Utility-first CSS framework

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **Class Variance Authority**: Component variant management
- **CLSX/Tailwind Merge**: Conditional CSS class utilities

### Database & State
- **sql.js**: In-browser SQLite implementation
- **Drizzle ORM**: Type-safe database operations
- **TanStack Query**: Server state management
- **Zod**: Runtime schema validation

### Telegram Integration
- **Native WebApp API**: Direct Telegram platform integration
- **No external Telegram libraries**: Uses built-in browser APIs

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot module replacement
- **Replit Integration**: Specialized plugins for Replit development environment
- **TypeScript Compilation**: Real-time type checking during development

### Production Build
- **Client Build**: Vite production build with code splitting and optimization
- **Server Build**: esbuild for Express server bundling
- **Static Assets**: Optimized and minified for fast loading

### Database Migration Path
- **Current**: Client-side SQLite with LocalStorage backup
- **Migration Ready**: Drizzle configuration prepared for PostgreSQL
- **Future**: Server-side database with user synchronization

### Telegram WebApp Deployment
- **Static Hosting**: Client-side app suitable for CDN deployment
- **Express Server**: Prepared for API endpoints when needed
- **Environment Variables**: Database URL configuration for production scaling

The architecture prioritizes local-first functionality while maintaining flexibility for future server-side features, ensuring a smooth user experience within the Telegram ecosystem.