import { OG_IMAGE_SIZE, renderOgImage } from "@/components/site/ogImage";

export const alt = "Audax HQ — the business operating system for service businesses";
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage();
}
