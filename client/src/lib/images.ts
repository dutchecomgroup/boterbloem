/**
 * Waar staat de afbeelding van dit item?
 *
 * Demo-content draagt een volledige URL in `filename`; echte uploads een UUID-bestandsnaam
 * die Express vanaf /uploads serveert. Deze helper hoort níét in `demoGallery.ts` te staan:
 * die verdwijnt bij de livegang, en dit blijft nodig.
 */
export function imageSrc(item: { filename: string }): string {
  if (item.filename.startsWith("http")) return item.filename;
  return `/uploads/gallery/${item.filename}`;
}
