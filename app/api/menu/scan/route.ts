import { NextResponse, type NextRequest } from "next/server";
import { extractFromFilename, mergeScans, parseVisionJson } from "@/lib/menu/ai-scanner";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  const batches = files.map((f) => extractFromFilename(f.name || "menu.jpg"));
  let items = mergeScans(batches.length ? batches : [extractFromFilename("bar-menu.jpg")]);

  const key = process.env.OPENAI_API_KEY;
  if (key && files[0]) {
    try {
      const buf = Buffer.from(await files[0].arrayBuffer());
      const b64 = buf.toString("base64");
      const mime = files[0].type || "image/jpeg";
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                'Extract bar/food menu lines as JSON {items:[{item_name,category,subtype,price,volume_spec,description}]}',
            },
            {
              role: "user",
              content: [
                { type: "text", text: "Digitize this menu." },
                { type: "image_url", image_url: { url: `data:${mime};base64,${b64}` } },
              ],
            },
          ],
        }),
      });
      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}") as {
        items?: unknown;
      };
      const vision = parseVisionJson(parsed.items);
      if (vision.length) items = vision;
    } catch {
      // keep filename heuristic catalog
    }
  }

  return NextResponse.json({
    ok: true,
    parsed_items: items,
    mode: key ? "vision" : "heuristic",
  });
}
