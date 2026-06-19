import OpenAI from "openai";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

/**
 * Automated Commentary Service
 * Uses OpenAI to generate natural, punchy cricket commentary.
 */
export const commentaryService = {
  /**
   * Generate commentary for a single ball or an over summary
   */
  generateCommentary: async (matchData) => {
    const {
      battingTeam,
      batsman,
      bowler,
      event,
      runs,
      isWicket,
      context,
      isOverComplete,
    } = matchData;

    // Basic fallback template
    let fallbackText = "";
    if (isOverComplete) {
      fallbackText = `End of the over bowled by ${bowler || "the bowler"}.`;
    } else if (isWicket) {
      fallbackText = `Wicket! ${batsman || "Batsman"} is out, bowled by ${bowler || "the bowler"}.`;
    } else if (runs > 0) {
      fallbackText = `${runs} run(s) off the delivery by ${bowler || "the bowler"} to ${batsman || "the batsman"}.`;
    } else {
      fallbackText = `Dot ball by ${bowler || "the bowler"}.`;
    }

    try {
      if (!openai) {
        return fallbackText;
      }

      let prompt = "";
      if (isOverComplete) {
        prompt = `You are a professional, high-energy cricket commentator. 
        Generate a short over-completion summary (max 25 words).
        - Bowler who just finished: ${bowler}
        - Context: ${context || "End of over"}
        
        Make it sound like a TV broadcast wrap-up.`;
      } else {
        prompt = `You are a professional, high-energy cricket commentator. 
        Generate a single, short, punchy sentence (max 20 words) for the following event:
        - Batting Team: ${battingTeam}
        - Batsman: ${batsman}
        - Bowler: ${bowler}
        - Event: ${event} (Runs: ${runs}, Wicket: ${isWicket})
        - Context: ${context || "Regular play"}
        
        Make it sound like a TV broadcast. Be creative and vary your style.`;
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 60,
      });

      return response.choices[0].message.content.trim().replace(/^"|"$/g, "");
    } catch (err) {
      logger.error("[AI] Error generating commentary with OpenAI:", err);
      return fallbackText;
    }
  },
};
