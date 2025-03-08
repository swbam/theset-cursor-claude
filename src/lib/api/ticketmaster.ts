import { env } from "@/env.mjs";
import { db } from "@/lib/db";
import { shows, venues } from "@/lib/db/schema";

// Basic Ticketmaster API call function with caching
async function ticketmasterApiCall<T>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T> {
  const apiKey = env.TICKETMASTER_API_KEY;

  if (!apiKey) {
    throw new Error("Ticketmaster API key is not set");
  }

  const searchParams = new URLSearchParams({
    ...params,
    apikey: apiKey,
  });

  const url = `https://app.ticketmaster.com/discovery/v2${endpoint}?${searchParams.toString()}`;

  const response = await fetch(url, {
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!response.ok) {
    throw new Error(`Ticketmaster API error: ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

// Venue interfaces
export interface TicketmasterVenue {
  id: string;
  name: string;
  city: {
    name: string;
  };
  state: {
    name: string;
  };
  country: {
    name: string;
    countryCode: string;
  };
  address: {
    line1: string;
  };
  location: {
    latitude: string;
    longitude: string;
  };
  url: string;
  timezone: string;
  parkingDetail: string;
  accessibleSeatingDetail: string;
  generalInfo: {
    capacity: number;
  };
  postalCode: string;
}

// Event interfaces
export interface TicketmasterEvent {
  id: string;
  name: string;
  type: string;
  url: string;
  images: {
    url: string;
    ratio: string;
    width: number;
    height: number;
  }[];
  dates: {
    start: {
      localDate: string;
      localTime: string;
      dateTime: string;
    };
    status: {
      code: string; // 'onsale', 'offsale', 'cancelled', 'postponed', 'rescheduled'
    };
  };
  sales: {
    public: {
      startDateTime: string;
      endDateTime: string;
    };
  };
  priceRanges?: {
    type: string;
    currency: string;
    min: number;
    max: number;
  }[];
  accessibility?: {
    info: string;
  };
  ticketLimit?: {
    info: string;
  };
  pleaseNote?: string;
  ticketing?: {
    allInclusivePricing?: {
      enabled: boolean;
    };
    safeTix?: {
      enabled: boolean;
    };
  };
  _embedded?: {
    venues: TicketmasterVenue[];
    attractions: {
      id: string;
      name: string;
      classifications?: {
        segment: {
          name: string;
        };
        genre: {
          name: string;
        };
        subGenre: {
          name: string;
        };
      }[];
    }[];
  };
}

// Response interfaces
export interface TicketmasterEventResponse {
  _embedded: {
    events: TicketmasterEvent[];
  };
  page: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

export interface TicketmasterVenueResponse {
  _embedded: {
    venues: TicketmasterVenue[];
  };
}

// Search for events by artist name
export async function getEventsByArtist(
  artistName: string
): Promise<TicketmasterEventResponse | null> {
  try {
    const response = await ticketmasterApiCall<TicketmasterEventResponse>(
      "/events",
      {
        keyword: artistName,
        size: "20",
        sort: "date,asc",
        classificationName: "music",
      }
    );

    return response;
  } catch (error) {
    console.error("Error fetching events:", error);
    return null;
  }
}

// Get event by ID
export async function getEventById(
  eventId: string
): Promise<TicketmasterEvent | null> {
  try {
    const response = await ticketmasterApiCall<TicketmasterEvent>(
      `/events/${eventId}`
    );
    return response;
  } catch (error) {
    console.error("Error fetching event:", error);
    return null;
  }
}

// Get venue by ID
export async function getVenueById(
  venueId: string
): Promise<TicketmasterVenue | null> {
  try {
    const response = await ticketmasterApiCall<TicketmasterVenue>(
      `/venues/${venueId}`
    );
    return response;
  } catch (error) {
    console.error("Error fetching venue:", error);
    return null;
  }
}

// Search for venues by name
export async function searchVenues(
  query: string
): Promise<TicketmasterVenue[]> {
  try {
    const response = await ticketmasterApiCall<TicketmasterVenueResponse>(
      "/venues",
      {
        keyword: query,
        size: "10",
      }
    );

    return response._embedded.venues;
  } catch (error) {
    console.error("Error searching venues:", error);
    return [];
  }
}

// Helper function to convert Ticketmaster event to our show schema
export function convertEventToShow(event: TicketmasterEvent, artistId: string) {
  const venue = event._embedded?.venues?.[0];

  if (!venue) {
    throw new Error("Event has no venue information");
  }

  // Get price ranges
  const priceRange = event.priceRanges?.find(
    (range) => range.type === "standard"
  ) || {
    currency: "USD",
    min: null,
    max: null,
  };

  // Map status codes
  const statusMap: Record<string, string> = {
    onsale: "on-sale",
    offsale: "sold-out",
    cancelled: "cancelled",
    postponed: "scheduled",
    rescheduled: "scheduled",
  };

  return {
    id: event.id,
    name: event.name,
    date: new Date(event.dates.start.dateTime),
    venue_id: venue.id,
    artist_id: artistId,
    ticket_url: event.url,
    event_url: event.url,
    image_url:
      event.images.find((img) => img.ratio === "16_9")?.url ||
      event.images[0]?.url,
    description: event.pleaseNote || null,
    min_price: priceRange.min,
    max_price: priceRange.max,
    currency: priceRange.currency,
    total_tickets: venue.generalInfo?.capacity || null,
    available_tickets: null, // Ticketmaster doesn't provide this info
    status: statusMap[event.dates.status.code] || "scheduled",
    last_updated: new Date(),
  };
}

// Helper function to convert Ticketmaster venue to our venue schema
export function convertVenueToVenue(venue: TicketmasterVenue) {
  return {
    id: venue.id,
    name: venue.name,
    city: venue.city.name,
    state: venue.state?.name || null,
    country: venue.country.name,
    latitude:
      venue.location?.latitude ? parseFloat(venue.location.latitude) : null,
    longitude:
      venue.location?.longitude ? parseFloat(venue.location.longitude) : null,
    timezone: venue.timezone || null,
    capacity: venue.generalInfo?.capacity || null,
    address: venue.address?.line1 || null,
    postal_code: venue.postalCode || null,
    url: venue.url || null,
    parking_info: venue.parkingDetail || null,
    accessible_seating_info: venue.accessibleSeatingDetail || null,
    last_updated: new Date(),
  };
}

// Search for events with enhanced filters
export async function searchEvents(params: {
  keyword?: string;
  genreId?: string;
  city?: string;
  stateCode?: string;
  countryCode?: string;
  radius?: string;
  unit?: "miles" | "km";
  startDateTime?: string;
  endDateTime?: string;
  includeFamily?: string;
  size?: string;
  sort?: string;
  latlong?: string;
}): Promise<TicketmasterEventResponse | null> {
  try {
    const searchParams: Record<string, string> = {
      classificationName: "music",
    };

    // Only add defined parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams[key] = value;
      }
    });

    const response = await ticketmasterApiCall<TicketmasterEventResponse>(
      "/events",
      searchParams
    );

    return response;
  } catch (error) {
    console.error("Error searching events:", error);
    return null;
  }
}
