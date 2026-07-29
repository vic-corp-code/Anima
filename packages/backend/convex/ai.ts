import { action } from "./_generated/server";
import { v } from "convex/values";

// AI service integration with OpenRouter for structured animal data extraction
export const extractAnimalData = action({
  args: {
    userInput: v.string(),
    locale: v.union(v.literal("fr"), v.literal("es")),
  },
  handler: async (ctx, { userInput, locale }) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-lite";

    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY not configured");
    }

    // JSON schema for structured output. Every optional field is expressed
    // as a nullable type AND listed in `required` — OpenRouter's strict
    // json_schema mode (see response_format below) requires this; a plain
    // omitted-if-absent property isn't supported under `strict: true`.
    const schema = {
      type: "object",
      properties: {
        animals: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Animal name or placeholder" },
              species: {
                type: "string",
                enum: ["dog", "cat"],
                description: "Species (dog or cat only)"
              },
              breed: { type: ["string", "null"], description: "Breed if specified" },
              sex: {
                type: "string",
                enum: ["male", "female", "unknown"],
                description: "Sex"
              },
              chipId: {
                type: ["string", "null"],
                description: "I-CAD identification number (15-digit code) if mentioned"
              },
              identificationMethod: {
                type: ["string", "null"],
                enum: ["chip", "tattoo", "none", null],
                description: "Identification method"
              },
              birthDate: {
                type: ["string", "null"],
                description: "Birth date in ISO format (YYYY-MM-DD) if known"
              },
              estimatedAge: {
                type: ["string", "null"],
                description: "Estimated age if birth date unknown (e.g., '1 year', '6 months')"
              },
              sterilized: {
                type: "boolean",
                description: "Whether the animal is sterilized"
              },
              healthNotes: {
                type: ["string", "null"],
                description: "Health conditions or observations"
              },
              characterNotes: {
                type: ["string", "null"],
                description: "Behavior or temperament notes"
              },
              arrivalDate: {
                type: "string",
                description: "Arrival date in ISO format (YYYY-MM-DD), defaults to today if not specified"
              },
              colors: {
                type: "array",
                items: { type: "string" },
                description: "Color descriptions, empty array if none mentioned"
              }
            },
            required: [
              "name", "species", "breed", "sex", "chipId",
              "identificationMethod", "birthDate", "estimatedAge",
              "sterilized", "healthNotes", "characterNotes", "arrivalDate",
              "colors"
            ],
            additionalProperties: false
          }
        },
        confidence: {
          type: "object",
          properties: {
            overall: {
              type: "number",
              description: "Overall confidence score (0-100)"
            }
          },
          required: ["overall"],
          additionalProperties: false
        },
        clarifications: {
          type: "array",
          items: { type: "string" },
          description: "Any information that needs clarification from the user, empty array if none"
        }
      },
      required: ["animals", "confidence", "clarifications"],
      additionalProperties: false
    };

    try {
      // Call OpenRouter API
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://anima.shelter",
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "system",
              content: `You are an expert animal shelter data entry assistant for ${locale === 'fr' ? 'French' : 'Spanish'} animal welfare organizations. Extract structured animal data from natural language input.

Rules:
- Only extract dog or cat species (start with these)
- If multiple animals are mentioned, create separate records for each
- Use ISO date format (YYYY-MM-DD)
- For arrival date, use today's date if not specified
- Provide an overall confidence score as an integer from 0 to 100 (not a 0-1 fraction)
- Flag information that needs clarification
- ${locale === 'fr' ? 'Respond in French when possible' : 'Respond in Spanish when possible'}

${locale === 'fr' ? 'French legal requirements: Keep in mind that identification numbers (I-CAD), arrival dates, and identification methods are legally required and must be confirmed by the user.' : 'Spanish legal requirements: Identification and arrival dates are legally required.'}`
            },
            {
              role: "user",
              content: userInput
            }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "animal_extraction",
              strict: true,
              schema,
            },
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error("No response from OpenRouter API");
      }

      const extracted = JSON.parse(data.choices[0].message.content);

      // Models tend to return a 0-1 fraction for "confidence" regardless of
      // the prompt asking for 0-100 — normalize so the frontend's 0-100
      // display/color thresholds are meaningful either way.
      if (
        typeof extracted?.confidence?.overall === "number" &&
        extracted.confidence.overall > 0 &&
        extracted.confidence.overall <= 1
      ) {
        extracted.confidence.overall = Math.round(extracted.confidence.overall * 100);
      }

      return {
        success: true,
        data: extracted
      };

    } catch (error) {
      console.error("AI extraction error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        fallback: {
          message: "Could not process input with AI. Please use manual form entry.",
          userInput
        }
      };
    }
  }
});
