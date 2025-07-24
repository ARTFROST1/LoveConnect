# DuoLove - Telegram WebApp for Couples Games

## Overview

DuoLove is a Telegram WebApp designed for couples, friends, and family members to connect and play interactive games together. The application allows two people to add each other as partners and engage in various mini-games, challenges, and quests to strengthen their relationship and have fun together online.

## User Preferences

Preferred communication style: Simple, everyday language.

## Current Issues & Solutions

### WebApp "Not Found" Error (Fixed)
**Problem**: When users click the WebApp button after accepting an invite, they get a "Not Found" error.
**Root Cause**: System was configured with wrong Replit URL.
**Solution**: Updated system to use correct working URL: `https://93828f49-b7a4-4135-ba2e-9d9278d7ea0d-00-11q6gmkwtm0pq.riker.replit.dev`

**Date**: July 23, 2025 - Issue fixed by updating WebApp URL in system.
**Date**: July 24, 2025 - Upgraded to use new working URL: `https://a14f2b3f-23b7-4c7f-9880-b16a8d739822-00-3bbojmz63mcbx.spock.replit.dev`
**Date**: July 24, 2025 - Successfully migrated from Replit Agent to full Replit environment with enhanced startapp parameter support

### Referral System Implementation (Completed)
**Date**: July 24, 2025 - Successfully implemented comprehensive referral-based partner connection system
**Problem**: Old invitation system was complex and relied on Telegram bot handling, causing connection issues
**Solution**: Created new referral system with direct web-based links and automatic processing
**Features Implemented**:
- Complete referral code generation and management system
- Server-side referral tracking with storage (MemStorage)
- Client-side referral processing hooks (use-referral-processing, use-referral-link)
- Automatic partner connection when users follow referral links
- Enhanced API endpoints (/api/referral/generate, /api/referral/connect, /api/referral/stats)
- Updated page AddPartnerNew.tsx with modern referral UI
- Comprehensive test page at `/referral-test` for validation
- Backward compatibility with existing partner management system

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
- **Server Framework**: Express.js with TypeScript for API endpoints and Telegram Bot integration
- **Telegram Bot**: node-telegram-bot-api integration for handling invite links and WebApp launching
- **Database Strategy**: Client-side SQLite using sql.js for local data storage
- **Data Persistence**: LocalStorage as backup for SQLite database
- **Session Management**: In-memory storage implementation with extensible interface
- **API Design**: RESTful endpoints with `/api` prefix including invite generation and bot management

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
- **WebApp API**: Full integration with Telegram WebApp features with startapp parameter processing
- **Telegram Bot**: Complete bot implementation (@duolove_bot) for handling invite links and launching WebApp
- **Deep Link System**: Modern startapp parameter support via https://t.me/duolove_bot/app?startapp=invite_{user_id}
- **Legacy Support**: Backward compatibility with legacy start parameter format
- **Auto-Invite Processing**: Automatic partner connection when users click invite links
- **Bidirectional Partnerships**: Mutual partner relationships created automatically
- **HTTPS WebApp URLs**: Proper Replit.app domain integration for Telegram WebApp compatibility
- **Parameter Detection**: Multi-method parameter detection (initDataUnsafe, URL params, fragments)
- **Retry Logic**: Robust retry mechanism for parameter detection with 5 attempts
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
1. User generates deep-link invite via Telegram Bot API (@duolove_bot)
2. Partner clicks link → Telegram Bot receives /start invite_{user_id}  
3. Bot launches WebApp with start_param containing invitation data
4. WebApp automatically processes invitation using useInviteProcessing hook
5. Bidirectional partnership created in both users' local SQLite databases
6. Success notification shown with haptic feedback
7. Both users can immediately start playing games together

### Game Sessions
1. User selects game from categorized list
2. Game session is created in local database
3. Game state is managed locally with periodic saves
4. Results are stored upon completion with scoring data

### Data Synchronization
- **Current**: Hybrid local + server synchronization system
- **Local Storage**: SQLite for user data and immediate partner relationships  
- **Server Storage**: MemStorage for bidirectional partnership synchronization
- **Real-time Updates**: Dual-source partner status checking (local DB + server polling)
- **Automatic Notifications**: Telegram bot notifications for partnership events

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