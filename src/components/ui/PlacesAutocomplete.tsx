'use client';
import { useEffect, useRef, useCallback } from 'react';

interface PlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  types?: string[];
}

declare global {
  interface Window {
    google: typeof google;
    initGooglePlaces?: () => void;
  }
}

let scriptLoaded = false;
let scriptLoading = false;
const callbacks: (() => void)[] = [];

function loadGoogleMapsScript(apiKey: string, onLoad: () => void) {
  if (scriptLoaded) { onLoad(); return; }
  callbacks.push(onLoad);
  if (scriptLoading) return;
  scriptLoading = true;
  window.initGooglePlaces = () => {
    scriptLoaded = true;
    callbacks.forEach(cb => cb());
    callbacks.length = 0;
  };
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGooglePlaces`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

export default function PlacesAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = 'Enter address',
  id,
  className,
  types = ['address'],
}: PlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const initAutocomplete = useCallback(() => {
    if (!inputRef.current || !window.google) return;
    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      types,
      componentRestrictions: { country: 'us' },
      fields: ['formatted_address', 'address_components', 'geometry'],
    });
    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current!.getPlace();
      const addr = place.formatted_address ?? inputRef.current?.value ?? '';
      onChange(addr);
      onPlaceSelect?.(place);
    });
  }, [onChange, onPlaceSelect, types]);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    if (!apiKey) return;
    loadGoogleMapsScript(apiKey, initAutocomplete);
  }, [initAutocomplete]);

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete="off"
      className={
        className ??
        'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
      }
    />
  );
}
