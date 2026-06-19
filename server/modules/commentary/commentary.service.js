import { Queue, Worker } from "bullmq";
import { bullmqConnection, redisClient } from "../../config/redis.js";
import OpenAI from "openai";
import { getIO } from "../../config/socket.js";
import logger from "../../utils/logger.js";
import { prisma } from "../../config/prisma.js";
import { exec } from "child_process";
import path from "path";
import fs from "fs";
import { promisify } from "util";

const execAsync = promisify(exec);

export const commentaryQueue = new Queue("commentary-generation", {
  connection: bullmqConnection,
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate commentary text using OpenAI or templates
 * Streams the response chunk-by-chunk to the websocket room for zero-latency UI updates
 */
const generateCommentaryText = async (
  liveData,
  ballEvent,
  language = "en",
  style = "professional",
  io = null,
  matchId = null
) => {
  const isBoundary = ballEvent.runs >= 4;
  const isWicket = ballEvent.isWicket;

  // LEVEL 1: Template Engine for standard deliveries (Fast & Free, English Only)
  if (!isBoundary && !isWicket && language === "en") {
    const templates = [
      `A solid delivery from the bowler, just ${ballEvent.runs} runs off it.`,
      `Pushed away for ${ballEvent.runs}. Good running between the wickets.`,
      `They take ${ballEvent.runs} runs comfortably.`,
      `That's ${ballEvent.runs} runs added to the total.`,
    ];
    let selectedTemplate =
      templates[Math.floor(Math.random() * templates.length)];
    if (ballEvent.runs === 0 && !ballEvent.isExtra) {
      selectedTemplate = "Solid defense. No run taken.";
    } else if (ballEvent.isExtra) {
      selectedTemplate = `That's an extra, given as ${ballEvent.extraType}.`;
    }

    // Simulate streaming for standard templates to keep UI consistent
    if (io && matchId) {
      io.to(matchId).emit("COMMENTARY_CHUNK", {
        chunk: selectedTemplate,
        isFinished: true,
        language,
      });
    }
    return selectedTemplate;
  }

  // LEVEL 2: AI Generation for Boundaries, Wickets, and Non-English Languages
  try {
    const languageMap = {
      en: "English",
      hi: "Hindi (in Devanagari script)",
      pa: "Punjabi (in Gurmukhi script)",
      bn: "Bengali (in Bengali script)",
      mr: "Marathi (in Devanagari script)",
      ta: "Tamil (in Tamil script)",
      te: "Telugu (in Telugu script)",
      gu: "Gujarati (in Gujarati script)",
    };
    const targetLanguage = languageMap[language] || language || "English";

    let styleInstruction = "Professional, Energetic TV Broadcast Style.";
    if (style === "natural")
      styleInstruction =
        "Natural, conversational, like a fan watching the game with friends.";
    if (style === "funny")
      styleInstruction =
        "Humorous, witty, using funny analogies and slightly exaggerated reactions.";
    if (style === "dramatic")
      styleInstruction =
        "Extremely dramatic, screaming at the top of your lungs, treating every moment as a life-or-death situation.";

    let matchSituationStr = `- Total Score: ${liveData.runs}/${liveData.wickets} in ${liveData.overs} overs.`;
    if (liveData.targetScore) {
      const runsNeeded = liveData.targetScore - liveData.runs;
      matchSituationStr += `\n- Chasing Target: ${liveData.targetScore} (Need ${runsNeeded} runs to win)`;
    }

    const batterName = ballEvent.batter?.name || "The batter";
    const bowlerName = ballEvent.bowler?.name || "The bowler";

    let eventDetails = `- Bowler: ${bowlerName}\n- Batter on strike: ${batterName}\n- Runs scored on this ball: ${ballEvent.runs}`;
    if (ballEvent.isExtra) {
      eventDetails += ` (Extra: ${ballEvent.extraType})`;
    }
    if (ballEvent.fieldingPosition) {
      eventDetails += `\n- Shot hit towards: ${ballEvent.fieldingPosition.replace(/_/g, " ")}`;
      if (ballEvent.distance) {
        eventDetails += ` (Distance: ${ballEvent.distance})`;
      }
    }
    if (isWicket) {
      eventDetails += `\n- WICKET! Type: ${ballEvent.wicketType || "Out"}`;
    }

    const prompt = `
You are a highly emotional, reactive human cricket commentator sitting right in the stadium.
You have a distinct personality and style: ${styleInstruction}

Generate ONE short, completely natural, human-like live commentary line for this exact event. 
This text will be used directly for a live audio broadcast, so it must sound realistic.
React authentically! If it's a wicket, act shocked or excited. If it's a boundary, act thrilled.

CRITICAL RULES:
1. Do NOT use ANY emojis, hashtags, or special symbols in your output.
2. You MUST use the actual Batter and Bowler names provided in the event data.

MATCH CONTEXT: 
${matchSituationStr}
- Match format: T20.

CURRENT BALL EVENT:
${eventDetails}

CRITICAL INSTRUCTION: You MUST generate the commentary text EXCLUSIVELY in the following language/script: ${targetLanguage}. Do not use English words if you are asked to speak in a regional language.
Return ONLY the commentary text. Nothing else. No quotes, no intro.`;

    const stream = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 60,
      temperature: 0.8,
      stream: true, // Industry standard: STREAMING
    });

    let fullText = "";
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullText += content;
        if (io && matchId) {
          io.to(matchId).emit("COMMENTARY_CHUNK", {
            chunk: content,
            isFinished: false,
            language,
          });
        }
      }
    }

    if (io && matchId) {
      io.to(matchId).emit("COMMENTARY_CHUNK", {
        chunk: "",
        isFinished: true,
        language,
      });
    }

    return fullText.trim();
  } catch (error) {
    logger.error("[Commentary] OpenAI Error:", error);
    if (isWicket)
      return "And that's a brilliant wicket! Huge moment in the match!";
    return "What a fantastic shot that is!";
  }
};

/**
 * TTS generation using OpenAI TTS API
 */
const generateOpenAIAudio = async (text, voiceModel = "alloy") => {
  try {
    const outputFileName = `commentary-${Date.now()}.mp3`;
    const outputPath = path.join(
      process.cwd(),
      "public",
      "audio",
      outputFileName
    );

    // Ensure public/audio directory exists
    const audioDir = path.dirname(outputPath);
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }
    // Ensure the voice model is a valid OpenAI voice, fallback to 'alloy' if it is a Piper TTS default
    const validOpenAIVoices = [
      "alloy",
      "echo",
      "fable",
      "onyx",
      "nova",
      "shimmer",
    ];
    const safeVoice = validOpenAIVoices.includes(voiceModel)
      ? voiceModel
      : "alloy";

    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: safeVoice,
      input: text,
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.promises.writeFile(outputPath, buffer);

    // Auto-delete the file after 30 seconds (fallback if it wasn't deleted by the client player)
    setTimeout(() => {
      fs.unlink(outputPath, (err) => {
        if (err && err.code !== "ENOENT") {
          // Ignore ENOENT (file already deleted)
        }
      });
    }, 30 * 1000);

    // Return the URL path
    return `/audio/${outputFileName}`;
  } catch (error) {
    logger.error(
      `[Commentary] OpenAI TTS failed, falling back to Browser TTS: ${error.message}`
    );
    return null;
  }
};

// Background Worker Processor
const worker = new Worker(
  "commentary-generation",
  async (job) => {
    const { matchId, liveData, ballEvent } = job.data;
    const io = getIO();

    try {
      // 1. Check if AI commentary is enabled for this match using REDIS CACHE
      const cacheKey = `hostedGame_settings_${matchId}`;
      let hostedGameStr = await redisClient.get(cacheKey);
      let hostedGame;

      if (hostedGameStr) {
        hostedGame = JSON.parse(hostedGameStr);
      } else {
        hostedGame = await prisma.hostedGame.findUnique({
          where: { id: matchId },
          select: {
            isAiCommentaryEnabled: true,
            commentaryVoice: true,
            commentaryLanguage: true,
            commentaryStyle: true,
          },
        });
        if (hostedGame) {
          await redisClient.setex(cacheKey, 60, JSON.stringify(hostedGame)); // Cache for 60 seconds
        }
      }

      if (!hostedGame || !hostedGame.isAiCommentaryEnabled) {
        return; // Commentary disabled
      }

      // 2. Generate Text Commentary
      // To reduce latency, we generate directly in the selected language.
      // The UI will display the text in the selected language, and the TTS will also use this exact text.
      let text = await generateCommentaryText(
        liveData,
        ballEvent,
        hostedGame.commentaryLanguage,
        hostedGame.commentaryStyle,
        io,
        matchId
      );
      let spokenText = text;

      // 3. Generate Audio with OpenAI TTS using the regional spokenText
      let audioUrl = await generateOpenAIAudio(
        spokenText,
        hostedGame.commentaryVoice
      );

      // 4. Broadcast final audio readiness
      if (io) {
        io.to(matchId).emit("COMMENTARY_AUDIO_READY", {
          text,
          audioUrl,
          voice: hostedGame.commentaryVoice,
          language: hostedGame.commentaryLanguage,
        });
      }

      return { success: true, text };
    } catch (error) {
      logger.error("[Commentary] Worker Error:", error);
      throw error;
    }
  },
  { connection: bullmqConnection }
);

worker.on("failed", (job, err) => {
  logger.error(`[Commentary] Job ${job.id} failed with error ${err.message}`);
});

export default { commentaryQueue };
