import { openai } from "@ai-sdk/openai";
import { redis } from "@repo/ratelimit";
import { generateText, stepCountIs } from "ai";
import axios from "axios";
import { randomUUID } from "crypto";
import { Resend } from "resend";
import { regularPromptWithWebSearch } from "../lib/ai/prompts";
import { getInformationTool, webSearchTool } from "../lib/ai/tools";
import { createRouter } from "../lib/create-app";
import { Message, WhatsAppMessage } from "../lib/types";

const sendOTPEmail = async (email: string, otp: number) => {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data } = await resend.emails.send({
    from: `CtxFlow <${process.env.FROM_EMAIL}>`,
    headers: {
      "X-Entity-Ref-ID": randomUUID(),
    },
    to: [email],
    subject: `Your OTP for CtxFlow WhatsApp Bot`,
    html: `<p>Your OTP code is:</p>
    <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 4px;">${otp}</h1>
    <p>This code will expire in 5 minutes.</p>
    <p>Enter this code in WhatsApp to start chatting.</p>
    <p>If you didn't request this, please ignore this email.</p>`,
  });
  return data;
};

const handleNotSupportedMessages = async (
  message: WhatsAppMessage,
  business_phone_number_id: string,
  type: string
) => {
  try {
    await axios.post(
      `${process.env.WHATSAPP_API_URL}/${business_phone_number_id}/messages`,
      {
        messaging_product: "whatsapp",
        to: message.from,
        text: {
          body: `Currently I can't support ${type} messages`,
        },
        context: {
          message_id: message.id,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_GRAPH_TOKEN}`,
        },
      }
    );

    await axios.post(
      `${process.env.WHATSAPP_API_URL}/${business_phone_number_id}/messages`,
      {
        messaging_product: "whatsapp",
        status: "read",
        message_id: message.id,
        typing_indicator: {
          type: "text",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_GRAPH_TOKEN}`,
        },
      }
    );
    return "ok";
  } catch (error) {
    console.error("Error in handleNotSupportedMessages:", error);
    return "error";
  }
};

export const whatsappwebhook = createRouter().get("/whatsapp/webhook", (c) => {
  try {
    const hub_mode = c.req.query("hub.mode");
    const hub_verify_token = c.req.query("hub.verify_token");
    const hub_challenge = c.req.query("hub.challenge");
    if (!hub_mode || !hub_verify_token || !hub_challenge) {
      return c.json({ message: "Invalid request" }, 400);
    }
    console.log(hub_mode, hub_verify_token, hub_challenge);
    // console.log(hub_mode, hub_verify_token, hub_challenge);
    if (
      hub_mode === "subscribe" &&
      hub_verify_token === process.env.WHATSAPP_VERIFY_TOKEN
    ) {
      console.log("Facebook webhook verified");
      return c.text(hub_challenge);
    }
    return c.json({ message: "Invalid token" }, 200);
  } catch (error) {
    console.log("[WEBHOOK_ERROR]", error);
    return c.json({ message: "Something went wrong" }, 200);
  }
});

export const whatsappChat = createRouter().post(
  "/whatsapp/webhook",
  async (c) => {
    try {
      const body = await c.req.json();
      const message = body.entry?.[0]?.changes[0]?.value
        ?.messages?.[0] as WhatsAppMessage;
      const business_phone_number_id = body.entry?.[0].changes?.[0].value
        ?.metadata?.phone_number_id as string;
      console.log(message, business_phone_number_id, "data");

      if (message) {
        const userKey = `user:${message.from}`;
        const state = (await redis.hget(userKey, "state")) as string | null;
        const isAuthenticated = state === "authenticated";
        const pendingOTP = state === "awaiting_otp";

        if (!isAuthenticated) {
          if (pendingOTP) {
            const otpRegex = /^\d{6}$/;

            if (message.text && otpRegex.test(message.text.body)) {
              const [storedOtpText, otpExpiresAt] = await Promise.all([
                redis.hget(userKey, "otp") as Promise<string | null>,
                redis.hget(userKey, "otp_expires_at") as Promise<string | null>,
              ]);

              const nowSec = Math.floor(Date.now() / 1000);
              const isExpired = otpExpiresAt
                ? parseInt(otpExpiresAt) < nowSec
                : false;

              if (isExpired) {
                await redis.hdel(userKey, "otp", "otp_expires_at");
                await redis.hset(userKey, { state: "idle" });
                await axios.post(
                  `${process.env.WHATSAPP_API_URL}/${business_phone_number_id}/messages`,
                  {
                    messaging_product: "whatsapp",
                    to: message.from,
                    text: {
                      body: " Your OTP has expired. Please send your email again to receive a new code.",
                    },
                    context: { message_id: message.id },
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${process.env.WHATSAPP_GRAPH_TOKEN}`,
                    },
                  }
                );
                return c.json({ message: "OTP expired" }, 200);
              }

              if (
                storedOtpText &&
                parseInt(storedOtpText) === parseInt(message.text.body)
              ) {
                await redis.hset(userKey, { state: "authenticated" });
                await redis.hdel(userKey, "auth");

                await redis.hdel(userKey, "otp", "otp_expires_at");
                try {
                  await (redis as any).persist(userKey);
                } catch {
                  await redis.expire(userKey, 60 * 60 * 24 * 30);
                }

                await axios.post(
                  `${process.env.WHATSAPP_API_URL}/${business_phone_number_id}/messages`,
                  {
                    messaging_product: "whatsapp",
                    status: "read",
                    message_id: message.id,
                    typing_indicator: { type: "text" },
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${process.env.WHATSAPP_GRAPH_TOKEN}`,
                    },
                  }
                );

                await axios.post(
                  `${process.env.WHATSAPP_API_URL}/${business_phone_number_id}/messages`,
                  {
                    messaging_product: "whatsapp",
                    to: message.from,
                    text: {
                      body: " OTP verified successfully! You can now start chatting with CtxFlow. Send any message to begin.",
                    },
                    context: { message_id: message.id },
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${process.env.WHATSAPP_GRAPH_TOKEN}`,
                    },
                  }
                );
                return c.json({ message: "OTP verified successfully" }, 200);
              } else {
                // Wrong OTP
                await axios.post(
                  `${process.env.WHATSAPP_API_URL}/${business_phone_number_id}/messages`,
                  {
                    messaging_product: "whatsapp",
                    to: message.from,
                    text: {
                      body: " Invalid OTP. Please check your email and enter the correct 6-digit code.",
                    },
                    context: { message_id: message.id },
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${process.env.WHATSAPP_GRAPH_TOKEN}`,
                    },
                  }
                );
                return c.json({ message: "Invalid OTP" }, 200);
              }
            } else {
              // Not a valid OTP format
              await axios.post(
                `${process.env.WHATSAPP_API_URL}/${business_phone_number_id}/messages`,
                {
                  messaging_product: "whatsapp",
                  to: message.from,
                  text: {
                    body: "Please enter the 6-digit OTP code sent to your email.",
                  },
                  context: { message_id: message.id },
                },
                {
                  headers: {
                    Authorization: `Bearer ${process.env.WHATSAPP_GRAPH_TOKEN}`,
                  },
                }
              );
              return c.json({ message: "Invalid OTP format" }, 200);
            }
          } else {
            const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

            if (message.text) {
              const emailMatch = message.text.body.match(emailRegex);

              if (emailMatch) {
                const extractedEmail = emailMatch[0];
                const otp = Math.floor(100000 + Math.random() * 900000);

                await redis.hset(userKey, {
                  email: extractedEmail,
                  otp: otp.toString(),
                  state: "awaiting_otp",
                  otp_expires_at: Math.floor(Date.now() / 1000) + 300,
                });
                await redis.expire(userKey, 300);

                const emailSent = await sendOTPEmail(extractedEmail, otp);

                await axios.post(
                  `${process.env.WHATSAPP_API_URL}/${business_phone_number_id}/messages`,
                  {
                    messaging_product: "whatsapp",
                    status: "read",
                    message_id: message.id,
                    typing_indicator: { type: "text" },
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${process.env.WHATSAPP_GRAPH_TOKEN}`,
                    },
                  }
                );

                await axios.post(
                  `${process.env.WHATSAPP_API_URL}/${business_phone_number_id}/messages`,
                  {
                    messaging_product: "whatsapp",
                    to: message.from,
                    text: {
                      body: emailSent
                        ? ` A 6-digit OTP has been sent to ${extractedEmail}. Please check your email and reply with the OTP code to verify.`
                        : ` Failed to send OTP to ${extractedEmail}. Please try again later.`,
                    },
                    context: { message_id: message.id },
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${process.env.WHATSAPP_GRAPH_TOKEN}`,
                    },
                  }
                );
                return c.json(
                  {
                    message: emailSent
                      ? "OTP sent successfully"
                      : "Failed to send OTP",
                  },
                  200
                );
              } else {
                await axios.post(
                  `${process.env.WHATSAPP_API_URL}/${business_phone_number_id}/messages`,
                  {
                    messaging_product: "whatsapp",
                    to: message.from,
                    text: {
                      body: "Please send your email address to verify your identity, Example: abc@gmail.com",
                    },
                    context: { message_id: message.id },
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${process.env.WHATSAPP_GRAPH_TOKEN}`,
                    },
                  }
                );
                return c.json({ message: "Invalid email format" }, 200);
              }
            } else {
              // No text message
              return c.json({ message: "No text message" }, 200);
            }
          }
        }

        if (message.type === "image") {
          await handleNotSupportedMessages(
            message,
            business_phone_number_id,
            message.type
          );
          return c.json({ message: "image not supported" }, 200);
        }
        if (message.type === "audio") {
          await handleNotSupportedMessages(
            message,
            business_phone_number_id,
            message.type
          );
          return c.json({ message: "audio not supported" }, 200);
        }
        if (message.type === "video") {
          await handleNotSupportedMessages(
            message,
            business_phone_number_id,
            message.type
          );
          return c.json({ message: "video not supported" }, 200);
        }
        if (message.type === "document") {
          await handleNotSupportedMessages(
            message,
            business_phone_number_id,
            message.type
          );
          return c.json({ message: "document not supported" }, 200);
        }
        if (message.type === "sticker") {
          await handleNotSupportedMessages(
            message,
            business_phone_number_id,
            message.type
          );
          return c.json({ message: "sticker not supported" }, 200);
        }
        if (message.type === "location") {
          await handleNotSupportedMessages(
            message,
            business_phone_number_id,
            message.type
          );
          return c.json({ message: "location not supported" }, 200);
        }
        if (message.type === "contact") {
          await handleNotSupportedMessages(
            message,
            business_phone_number_id,
            message.type
          );
          return c.json({ message: "contact not supported" }, 200);
        }
        if (message.type === "interactive") {
          await handleNotSupportedMessages(
            message,
            business_phone_number_id,
            message.type
          );
          return c.json({ message: "interactive not supported" }, 200);
        }
        if (message.type === "poll") {
          await handleNotSupportedMessages(
            message,
            business_phone_number_id,
            message.type
          );
          return c.json({ message: "poll not supported" }, 200);
        }
        if (message.text.body === "/clear") {
          const isPresent = await redis.exists(`chat:${message.from}`);
          console.log(isPresent, "isPresent");
          if (isPresent) {
            await redis.rename(
              `chat:${message.from}`,
              `chat:${message.from}:deleted`
            );

            await axios.post(
              `${process.env.WHATSAPP_API_URL}/${business_phone_number_id}/messages`,
              {
                messaging_product: "whatsapp",
                status: "read",
                message_id: message.id,
                typing_indicator: { type: "text" },
              },
              {
                headers: {
                  Authorization: `Bearer ${process.env.WHATSAPP_GRAPH_TOKEN}`,
                },
              }
            );
            await axios.post(
              `${process.env.WHATSAPP_API_URL}/${business_phone_number_id}/messages`,
              {
                messaging_product: "whatsapp",
                to: message.from,
                text: {
                  body: "All your messages have been deleted from this chat. You can continue the conversation with a new chat again",
                },
              },
              {
                headers: {
                  Authorization: `Bearer ${process.env.WHATSAPP_GRAPH_TOKEN}`,
                },
              }
            );
          } else {
            await axios.post(
              `${process.env.WHATSAPP_API_URL}/${business_phone_number_id}/messages`,
              {
                messaging_product: "whatsapp",
                status: "read",
                message_id: message.id,
                typing_indicator: { type: "text" },
              },
              {
                headers: {
                  Authorization: `Bearer ${process.env.WHATSAPP_GRAPH_TOKEN}`,
                },
              }
            );
            await axios.post(
              `${process.env.WHATSAPP_API_URL}/${business_phone_number_id}/messages`,
              {
                messaging_product: "whatsapp",
                to: message.from,
                text: {
                  body: "You are already in a new chat",
                },
              },
              {
                headers: {
                  Authorization: `Bearer ${process.env.WHATSAPP_GRAPH_TOKEN}`,
                },
              }
            );
          }

          return c.json({ message: "cleared" }, 200);
        }

        if (message.type == "text") {
          if (!message.text) {
            return c.json({ message: "ignored" }, 200);
          }

          if (!message || message.type !== "text" || !message.text) {
            return c.json({ message: "ignored" }, 200);
          }
          const userMessage: Message = {
            role: "user",
            content: message.text.body,
          };
          let previousMessages = (await redis.lrange(
            `chat:${message.from}`,
            0,
            -1
          )) as Message[];

          if (!previousMessages) {
            await redis.rpush(
              `chat:${message.from}`,
              JSON.stringify(userMessage)
            );
          } else {
            await redis.rpush(
              `chat:${message.from}`,
              JSON.stringify(userMessage)
            );
          }
          await axios.post(
            `${process.env.WHATSAPP_API_URL}/${business_phone_number_id}/messages`,
            {
              messaging_product: "whatsapp",
              status: "read",
              message_id: message.id,
              typing_indicator: { type: "text" },
            },
            {
              headers: {
                Authorization: `Bearer ${process.env.WHATSAPP_GRAPH_TOKEN}`,
              },
            }
          );

          const slicedMessages = previousMessages.slice(-10);
          const { text } = await generateText({
            model: openai("gpt-4.1"),
            messages: [...slicedMessages, userMessage],
            stopWhen: stepCountIs(5),
            tools: {
              getInformationTool,
              webSearchTool,
            },
            system:
              regularPromptWithWebSearch +
              `You are the CtxFlow WhatsApp bot. You are talking to a user about the configured knowledge base. Return Markdown in WhatsApp-specific format.`,
          });
          const assistantMessage: Message = {
            role: "assistant",
            content: text,
          };
          await redis.rpush(
            `chat:${message.from}`,
            JSON.stringify(assistantMessage)
          );
          await axios.post(
            `${process.env.WHATSAPP_API_URL}/${business_phone_number_id}/messages`,
            {
              messaging_product: "whatsapp",
              to: message.from,
              text: { body: text },
              context: { message_id: message.id },
            },
            {
              headers: {
                Authorization: `Bearer ${process.env.WHATSAPP_GRAPH_TOKEN}`,
              },
            }
          );
        }
        return c.json({ message: "Message sent" }, 200);
      }
      return c.json({ message: "Message ignored" }, 200);
    } catch (error) {
      console.log("Whatsapp response error", error);
      return c.json({ message: "Something went wrong" }, 200);
    }
  }
);
