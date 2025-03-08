# TheSet - Concert Discovery and Setlist Voting Platform

TheSet is a modern web application that helps music fans discover upcoming concerts and collaborate on creating the perfect setlists through voting. Built with Next.js, Supabase, and Spotify integration, TheSet provides a seamless experience for concert-goers to find shows, vote on songs, and connect with other fans.

## Features

- **Concert Discovery**: Find upcoming shows by your favorite artists
- **Setlist Voting**: Vote on songs you want to hear at upcoming concerts
- **Spotify Integration**: Connect your Spotify account to see shows from artists you follow
- **Real-time Updates**: See votes and suggestions in real-time
- **Mobile Optimized**: Fully responsive design with swipe gestures and bottom navigation
- **Dark Mode**: Beautiful dark theme for comfortable browsing

## Tech Stack

- **Framework**: Next.js (App Router)
- **UI Components**: ShadCN UI and Tailwind CSS
- **Database**: Supabase with Drizzle ORM
- **Authentication**: Supabase Auth with Spotify OAuth
- **APIs**: Ticketmaster Discovery API, Spotify API
- **Real-time**: WebSockets via Supabase Realtime
- **Caching**: Redis for server-side, TanStack Query for client-side

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Supabase account
- Spotify Developer account
- Ticketmaster Developer account

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/theset.git
   cd theset
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   bun install
   ```

3. Copy the environment variables:

   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your API keys and credentials.

5. Run the development server:

   ```bash
   npm run dev
   # or
   bun dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Setup

1. Create a Supabase project
2. Run the database migrations:
   ```bash
   npm run db:migrate
   # or
   bun db:migrate
   ```

## Project Structure

- `src/app/` - Next.js App Router pages and layouts
- `src/components/` - Reusable UI components
- `src/lib/` - Utility functions and API clients
- `src/lib/db/` - Database schema and queries
- `src/lib/api/` - API client implementations
- `src/hooks/` - Custom React hooks
- `src/config/` - Application configuration

## Key Features Implementation

### Concert Discovery

The app uses the Ticketmaster API to fetch upcoming concerts and venue information. Users can filter shows by genre, location, date, and price range.

### Setlist Voting

Users can vote on songs they want to hear at upcoming concerts. The voting system is implemented using Supabase's real-time capabilities, allowing for instant updates across all clients.

### Spotify Integration

Users can connect their Spotify accounts to see shows from artists they follow and get personalized recommendations based on their listening history.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [Spotify API](https://developer.spotify.com/documentation/web-api/)
- [Ticketmaster API](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/)
- [ShadCN UI](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
