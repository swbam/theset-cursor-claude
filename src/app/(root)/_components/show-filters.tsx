"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowUpDown,
  CalendarIcon,
  DollarSign,
  FilterIcon,
  Loader2,
  MapPinIcon,
  SlidersHorizontal,
  ThumbsUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

// Enhanced genre structure with subgenres
const GENRES = {
  Rock: [
    "Alternative Rock",
    "Classic Rock",
    "Hard Rock",
    "Indie Rock",
    "Metal",
    "Punk Rock",
    "Progressive Rock",
  ],
  Pop: ["Pop Rock", "Synth Pop", "K-Pop", "Dance Pop", "Indie Pop"],
  "Hip Hop": ["Rap", "Trap", "Alternative Hip Hop", "Old School Hip Hop"],
  "R&B": ["Soul", "Contemporary R&B", "Neo Soul", "Gospel"],
  Electronic: ["House", "Techno", "EDM", "Dubstep", "Trance"],
  Country: ["Traditional Country", "Country Pop", "Bluegrass", "Country Rock"],
  Jazz: ["Smooth Jazz", "Bebop", "Fusion", "Big Band"],
  Classical: ["Orchestra", "Chamber Music", "Opera", "Contemporary Classical"],
  World: ["Latin", "Reggae", "African", "Asian"],
};

const SORT_OPTIONS = [
  { value: "date-asc", label: "Date (Earliest First)" },
  { value: "date-desc", label: "Date (Latest First)" },
  { value: "votes-desc", label: "Most Voted" },
  { value: "popularity-desc", label: "Most Popular" },
  { value: "price-asc", label: "Price (Low to High)" },
  { value: "price-desc", label: "Price (High to Low)" },
  { value: "distance-asc", label: "Distance (Nearest First)" },
];

export function ShowFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filter states
  const [mainGenre, setMainGenre] = useState(
    searchParams.get("mainGenre") || "All Genres"
  );
  const [subGenres, setSubGenres] = useState<string[]>(
    searchParams.get("subGenres")?.split(",") || []
  );
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [radius, setRadius] = useState(
    parseInt(searchParams.get("radius") || "50")
  );
  const [date, setDate] = useState<Date | undefined>(
    searchParams.get("date") ? new Date(searchParams.get("date")!) : undefined
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([
    parseInt(searchParams.get("minPrice") || "0"),
    parseInt(searchParams.get("maxPrice") || "1000"),
  ]);
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "date-asc");
  const [useLocation, setUseLocation] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Get user's location
  const getUserLocation = async () => {
    if (!navigator.geolocation) {
      return;
    }

    setIsLoadingLocation(true);

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        }
      );

      const { latitude, longitude } = position.coords;

      // Use reverse geocoding to get city name
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${process.env.NEXT_PUBLIC_OPENCAGE_API_KEY}`
      );

      const data = await response.json();
      const city = data.results[0]?.components.city;

      if (city) {
        setLocation(city);
        setUseLocation(true);
      }
    } catch (error) {
      console.error("Error getting location:", error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Apply filters
  const applyFilters = () => {
    const params = new URLSearchParams(searchParams);
    const newActiveFilters: string[] = [];

    // Genre filters
    if (mainGenre && mainGenre !== "All Genres") {
      params.set("mainGenre", mainGenre);
      newActiveFilters.push(mainGenre);

      if (subGenres.length > 0) {
        params.set("subGenres", subGenres.join(","));
        newActiveFilters.push(...subGenres);
      }
    } else {
      params.delete("mainGenre");
      params.delete("subGenres");
    }

    // Location filters
    if (location) {
      params.set("location", location);
      params.set("radius", radius.toString());
      newActiveFilters.push(`${location} (${radius}mi)`);
    } else {
      params.delete("location");
      params.delete("radius");
    }

    // Date filter
    if (date) {
      params.set("date", format(date, "yyyy-MM-dd"));
      newActiveFilters.push(format(date, "MMM d, yyyy"));
    } else {
      params.delete("date");
    }

    // Price range filter
    if (priceRange[0] > 0 || priceRange[1] < 1000) {
      params.set("minPrice", priceRange[0].toString());
      params.set("maxPrice", priceRange[1].toString());
      newActiveFilters.push(`$${priceRange[0]} - $${priceRange[1]}`);
    } else {
      params.delete("minPrice");
      params.delete("maxPrice");
    }

    // Sort option
    if (sortBy !== "date-asc") {
      params.set("sort", sortBy);
      newActiveFilters.push(
        SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label || ""
      );
    } else {
      params.delete("sort");
    }

    setActiveFilters(newActiveFilters);
    router.push(`/?${params.toString()}`);
  };

  // Clear all filters
  const clearFilters = () => {
    setMainGenre("All Genres");
    setSubGenres([]);
    setLocation("");
    setRadius(50);
    setDate(undefined);
    setPriceRange([0, 1000]);
    setSortBy("date-asc");
    setUseLocation(false);
    setActiveFilters([]);

    router.push("/");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Filter Shows</CardTitle>
          {activeFilters.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear All
            </Button>
          )}
        </div>
        <CardDescription>
          Find concerts by genre, location, date, and more
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Genre Selection */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="mainGenre">Main Genre</Label>
              <Select value={mainGenre} onValueChange={setMainGenre}>
                <SelectTrigger id="mainGenre">
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Genres">All Genres</SelectItem>
                  {Object.keys(GENRES).map((genre) => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {mainGenre !== "All Genres" && (
              <div>
                <Label>Subgenres</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {GENRES[mainGenre as keyof typeof GENRES].map((subGenre) => (
                    <div key={subGenre} className="flex items-center space-x-2">
                      <Switch
                        checked={subGenres.includes(subGenre)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSubGenres([...subGenres, subGenre]);
                          } else {
                            setSubGenres(
                              subGenres.filter((g) => g !== subGenre)
                            );
                          }
                        }}
                      />
                      <Label>{subGenre}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Location Selection */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="location">Location</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPinIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="City or venue"
                    className="pl-10"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={getUserLocation}
                  disabled={isLoadingLocation}
                >
                  {isLoadingLocation ?
                    <Loader2 className="h-4 w-4 animate-spin" />
                  : <MapPinIcon className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {location && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Search Radius</Label>
                  <span className="text-sm text-muted-foreground">
                    {radius} miles
                  </span>
                </div>
                <Slider
                  value={[radius]}
                  min={5}
                  max={500}
                  step={5}
                  onValueChange={([value]) => setRadius(value)}
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Date Selection */}
          <div>
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  id="date"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Separator />

          {/* Price Range */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Price Range</Label>
              <span className="text-sm text-muted-foreground">
                ${priceRange[0]} - ${priceRange[1]}
              </span>
            </div>
            <Slider
              value={priceRange}
              min={0}
              max={1000}
              step={10}
              onValueChange={(value) =>
                setPriceRange(value as [number, number])
              }
            />
          </div>

          <Separator />

          {/* Sort Options */}
          <div>
            <Label htmlFor="sortBy">Sort By</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger id="sortBy">
                <SelectValue placeholder="Select sorting" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-4 border-t pt-4">
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <Badge key={filter} variant="secondary">
              {filter}
            </Badge>
          ))}
        </div>
        <Button className="w-full" onClick={applyFilters}>
          <FilterIcon className="mr-2 h-4 w-4" />
          Apply Filters
        </Button>
      </CardFooter>
    </Card>
  );
}
