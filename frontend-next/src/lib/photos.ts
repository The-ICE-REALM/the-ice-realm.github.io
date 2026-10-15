import type { VenueDto } from "@/types";

/**
 * Ground photos: save one as src/assets/arenas/<venue slug>.jpg (or .jpeg, .png, .webp),
 * e.g. lokhandwala.jpg, and it replaces that ground's stock photo from the API on the next build.
 */
const localPhotos = import.meta.glob<string>("/src/assets/arenas/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}", {
  eager: true,
  import: "default",
});

export function venuePhoto(venue: VenueDto): string | null {
  const slug = venue.slug?.toLowerCase();
  const file = slug
    ? Object.keys(localPhotos).find((path) => path.slice(path.lastIndexOf("/") + 1, path.lastIndexOf(".")) === slug)
    : undefined;
  return file ? localPhotos[file] : venue.photoUrl;
}
