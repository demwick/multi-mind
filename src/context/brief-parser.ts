export interface ParsedBrief {
  raw: string;
  slug: string;
  date: string; // YYYY-MM-DD format
  outputDir: string; // `${outputBase}/${date}-${slug}`
}

/**
 * Converts text to URL-safe slug.
 * - Converts to lowercase
 * - Removes special characters (except hyphens)
 * - Replaces spaces with hyphens
 * - Collapses multiple hyphens to single hyphen
 * - Truncates to 50 characters max
 */
export function slugify(text: string): string {
  return text
    .toLowerCase() // Convert to lowercase
    .replace(/[^\w\s-]/g, '') // Remove special characters except word chars, spaces, and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .slice(0, 50); // Truncate to 50 chars max
}

/**
 * Parses a brief string into structured data.
 * The slug is generated from the first comma-separated segment.
 * @param brief The brief string to parse
 * @param outputBase The base output directory (defaults to 'output')
 */
export function parseBrief(brief: string, outputBase: string = 'output'): ParsedBrief {
  // Extract the first comma-separated segment for the slug
  const firstSegment = brief.split(',')[0].trim();
  const slug = slugify(firstSegment);

  // Generate date in YYYY-MM-DD format
  const date = new Date().toISOString().split('T')[0];

  // Construct outputDir as ${outputBase}/${date}-${slug}
  const outputDir = `${outputBase}/${date}-${slug}`;

  return {
    raw: brief,
    slug,
    date,
    outputDir,
  };
}
