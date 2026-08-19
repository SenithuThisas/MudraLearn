// Reference demonstration clips are static assets under public/reference/,
// copied out of the training dataset by scripts/setup-reference-clips.mjs.
// There is no manifest: the filename is derived from the sign id, and a missing
// clip simply 404s so <ReferenceVideo> can fall back to its placeholder.

// Keep in sync with slugify() in scripts/setup-reference-clips.mjs.
export function referenceClipUrl(signId: string): string {
  const slug = signId
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `/reference/${slug}.mp4`
}
