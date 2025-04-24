require("dotenv").config(); // Load environment variables from .env
const { Client, GatewayIntentBits } = require("discord.js"); // Import Discord.js client and intents
const express = require("express"); // Import Express for HTTP server
const app = express(); // Create Express app

app.use(express.json()); // Parse incoming JSON requests

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

client.once("ready", () => console.log("Bot's Live!")); // Log when bot is ready

app.post("/assign-role", async (req, res) => { // Define POST endpoint /assign-role

  const { userDiscordId, role } = req.body; // Get Discord ID and role from request body

  try {
    if (!userDiscordId || !role) {
      return res.status(400).json({ success: false, error: "Missing userDiscordId or role" });
    }

    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    if (!guild) {
      throw new Error("Guild not found—check GUILD_ID");
    }
    
    const roleMap = { // Map role names to Discord role IDs
      frontend: process.env.FRONTEND_ROLE_ID,
      backend: process.env.BACKEND_ROLE_ID,
      fullstack: process.env.FULLSTACK_ROLE_ID,
    };

    const roleId = roleMap[role.toLowerCase()]; // Get role ID from map, lowercase for consistency
    if (!roleId) throw new Error("Invalid role"); // Error if role isn’t valid

    let member;

    try {
      member = await guild.members.fetch(userDiscordId); // Try to fetch member
    } catch (error) {
      if (error.code === 10013) { // Unknown User
        return res.status(404).json({ success: false, error: "User not found in server—please join first" });
      }
      throw error; // Other errors (e.g., permissions)
    }

    await member.roles.add(roleId); // Add role to member
    res.json({ success: true }); // Send success response

  } catch (error) { // Catch errors
    console.error("Role assignment error:", error); // Log error details
    res.status(500).json({ success: false, error: error.message }); // Return 500 with error
  }
});

// member check logic
app.get("/check-member", async (req, res) => {
  const { discordId } = req.query;
  try {
    if (!discordId) return res.status(400).json({ success: false, error: "Missing discordId" });
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    if (!guild) throw new Error("Guild not found");

    await guild.members.fetch(discordId); // Throws if not found
    res.json({ success: true, inServer: true });
  } catch (error) {
    if (error.code === 10013) {
      return res.status(404).json({ success: false, error: "User not in server", inServer: false });
    }
    console.error("Check member error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

client.login(process.env.BOT_KEY); // Log bot into Discord with token from .env
app.listen(3001, () => console.log("Bot server on 3001")); // Start Express server on port 3001