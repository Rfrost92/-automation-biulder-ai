import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const { description, style } = await req.json();

        if (!description) {
            return NextResponse.json(
                { error: "Description is required." },
                { status: 400 }
            );
        }

        const systemPrompt = `
You are an Automation Architect specializing in Zapier, Make.com, and custom API workflows.

Your job is to analyze a user's automation request and return a complete, structured plan for building the automation.

Target JSON shape:
{
  "services": ["string"],
  "trigger": {
    "service": "string",
    "event": "string",
    "sample_payload": {}
  },
  "steps": [
    {
      "service": "string",
      "action": "string",
      "description": "string",
      "mapping": {}
    }
  ],
  "zapier_json": {}
}

Rules:
- Only include services relevant to the user's description.
- Provide realistic events and payloads.
- Keep payloads simple and safe.
- If style = "Make", use Make wording ("Modules", "Connections").
- If style = "Custom", focus more on API calls.
`;

        const response = await openai.responses.create({
            model: "gpt-4.1",
            input: [
                { role: "system", content: systemPrompt },
                {
                    role: "user",
                    content: `User automation request: "${description}". Style: ${style}.`,
                },
            ],
            text: {
                format: {
                    type: "json_schema",
                    name: "automation_plan",
                    // strict OFF → не буде чіплятись до additionalProperties
                    strict: false,
                    schema: {
                        type: "object",
                        properties: {
                            services: {
                                type: "array",
                                items: { type: "string" },
                            },
                            trigger: {
                                type: "object",
                                properties: {
                                    service: { type: "string" },
                                    event: { type: "string" },
                                    sample_payload: { type: "object" },
                                },
                                required: ["service", "event", "sample_payload"],
                            },
                            steps: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        service: { type: "string" },
                                        action: { type: "string" },
                                        description: { type: "string" },
                                        mapping: { type: "object" },
                                    },
                                    required: ["service", "action", "description", "mapping"],
                                },
                            },
                            zapier_json: { type: "object" },
                        },
                        required: ["services", "trigger", "steps", "zapier_json"],
                    },
                },
            },
        });

        // розвалюємо типізацію, щоб не паритись з union-типами
        const anyResponse = response as any;
        const contentText =
            anyResponse.output?.[0]?.content?.[0]?.text ?? "";

        if (!contentText) {
            throw new Error("No content returned from model");
        }

        const parsed = JSON.parse(contentText);

        return NextResponse.json(parsed);
    } catch (err: any) {
        console.error(err);
        return NextResponse.json(
            { error: err.message ?? "Unknown error" },
            { status: 500 }
        );
    }
}
