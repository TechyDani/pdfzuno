import {
  downloadPinterest,
  pinterestErrorResponse,
} from "@/lib/pinterest/server";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    return await downloadPinterest(
      params.get("pin") || "",
      params.get("media") || "",
      request.signal,
    );
  } catch (error) {
    return pinterestErrorResponse(error);
  }
}
