"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  MapPinIcon,
  Search,
  TagIcon,
} from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";

// This needs to be a client component since it uses hooks and form state
export function ShowFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get current filter values from URL
  const genre = searchParams.get("genre") || "";
  const location = searchParams.get("location") || "";
  const date = searchParams.get("date") || "";

  const form = useForm({
    defaultValues: {
      genre,
      location,
      date: date ? new Date(date) : undefined,
    },
  });

  // List of music genres
  const genres = [
    "All Genres",
    "Rock",
    "Pop",
    "Hip Hop",
    "Electronic",
    "Jazz",
    "Classical",
    "Country",
    "R&B",
    "Metal",
    "Indie",
    "Folk",
    "Blues",
  ];

  // Function to apply filters
  const applyFilters = (values: any) => {
    const params = new URLSearchParams();

    if (values.genre && values.genre !== "All Genres") {
      params.set("genre", values.genre);
    }

    if (values.location) {
      params.set("location", values.location);
    }

    if (values.date) {
      params.set("date", values.date.toISOString().split("T")[0]);
    }

    // Navigate to the current path with new query params
    const queryString = params.toString();
    const url = queryString ? `?${queryString}` : "";
    router.push(url);
  };

  // Function to clear all filters
  const clearFilters = () => {
    form.reset({
      genre: "",
      location: "",
      date: undefined,
    });
    router.push("/");
  };

  // Get user's location (simplified for demo)
  const getUserLocation = async () => {
    try {
      form.setValue("location", "San Francisco, CA");
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };

  return (
    <div className="bg-muted p-4 rounded-lg">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(applyFilters)}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          {/* Genre Filter */}
          <FormField
            control={form.control}
            name="genre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Genre</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <div className="flex items-center">
                        <TagIcon className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Filter by genre" />
                      </div>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {genres.map((genre) => (
                      <SelectItem key={genre} value={genre}>
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          {/* Location Filter */}
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex justify-between">
                  Location
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 h-auto text-xs"
                    onClick={getUserLocation}
                  >
                    Use my location
                  </Button>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <MapPinIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="City or venue"
                      className="pl-8"
                      {...field}
                    />
                  </div>
                </FormControl>
              </FormItem>
            )}
          />

          {/* Date Filter */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ?
                          format(field.value, "PPP")
                        : <span>Pick a date</span>}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </FormItem>
            )}
          />

          {/* Action Buttons */}
          <div className="flex items-end gap-2">
            <Button type="submit" className="flex-1">
              <Search className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={clearFilters}
              className="flex-1"
            >
              Clear
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
