// Preserve existing bookmarks on static hosts; metadata identifies /tools/ as canonical.
export {
  default,
  generateMetadata,
  generateStaticParams,
} from "../tools/[slug]/page";

export const dynamicParams = false;
