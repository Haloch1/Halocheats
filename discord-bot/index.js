const { Client, WebhookClient } = require('discord.js-selfbot-v13');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const WEBHOOKS_FILE = path.join(__dirname, 'webhooks.json');

// Render's "Secret Files" feature (used to keep config.json out of git) mounts
// files at /etc/secrets/<filename>, not into the app's own directory. Check the
// local path first (works when running on your own machine), then fall back to
// Render's secret-file location (works when deployed).
const LOCAL_CONFIG_FILE = path.join(__dirname, 'config.json');
const RENDER_SECRET_CONFIG_FILE = '/etc/secrets/config.json';
const CONFIG_FILE = fs.existsSync(LOCAL_CONFIG_FILE) ? LOCAL_CONFIG_FILE : RENDER_SECRET_CONFIG_FILE;

// Load configuration from config.json
let config = {
    targetGuildId: null,
    modes: {
        fullServerCopy: false,
        autoCreateChannels: true
    },
    sourceGuildId: null,
    channels: [],
    categorySettings: {
        targetCategoryId: null,
        copyCategoryStructure: false
    },
    botSettings: {
        username: 'Bot'
    },
    loopMessage: {
        enabled: false,
        sourceChannelId: '',
        messageId: '',      // legacy single-message field, still supported
        messageIds: [],      // preferred: loop multiple messages from the same channel
        intervalSeconds: 60,
        randomJitterSeconds: 0
    }
};

function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const data = fs.readFileSync(CONFIG_FILE, 'utf8');
            const loadedConfig = JSON.parse(data);
            config = { ...config, ...loadedConfig };
            console.log('📂 Loaded configuration from config.json');
        } else {
            console.log('⚠️ config.json not found, using defaults and .env fallback');
        }
    } catch (error) {
        console.error('❌ Error loading config.json:', error.message);
    }
}

// Load config on startup
loadConfig();

// Watch for changes to config.json
function watchConfigFile() {
    console.log('👀 Watching config.json for changes...');
    fs.watch(CONFIG_FILE, (eventType) => {
        if (eventType === 'change') {
            console.log('\n🔄 Detected change in config.json, reloading...');
            setTimeout(() => {
                loadConfig();
                loadChannelsFromConfig();
                if (client.isReady()) {
                    startLoopMessage();
                }
            }, 100);
        }
    });
}

// Token (sensitive - keep in .env). Whatever token you were already using with
// this project goes here — this file doesn't care whether it came from the
// Developer Portal or is the token your normal client uses.
const TOKEN = process.env.TOKEN || process.env.BOT_TOKEN;

// Configuration values (prioritize config.json, fallback to .env)
const BOT_USERNAME = config.botSettings.username;
const TARGET_GUILD_ID = config.targetGuildId || process.env.TARGET_GUILD_ID;
const TARGET_CATEGORY_ID = config.categorySettings.targetCategoryId || process.env.TARGET_CATEGORY_ID || null;
const COPY_CATEGORY_STRUCTURE = config.categorySettings.copyCategoryStructure || process.env.COPY_CATEGORY_STRUCTURE === 'true';
const SOURCE_GUILD_ID = config.sourceGuildId || process.env.SOURCE_GUILD_ID || null;
const FULL_SERVER_COPY = config.modes.fullServerCopy || process.env.FULL_SERVER_COPY === 'true';
const AUTO_CREATE_CHANNELS = config.modes.autoCreateChannels !== false && process.env.AUTO_CREATE_CHANNELS !== 'false';

if (!TOKEN) {
    console.error('❌ No token configured! Set TOKEN (or BOT_TOKEN) in .env');
    process.exit(1);
}

// Storage for channel mappings: { sourceChannelId: { webhookUrl, targetChannelId, targetChannelName } }
let channelWebhookMap = {};

// Lock to prevent concurrent webhook creation for the same channel
const creationLocks = new Map();

// Load existing webhook mappings from file
function loadWebhookMappings() {
    try {
        if (fs.existsSync(WEBHOOKS_FILE)) {
            const data = fs.readFileSync(WEBHOOKS_FILE, 'utf8');
            channelWebhookMap = JSON.parse(data);
            console.log('📂 Loaded existing webhook mappings:', Object.keys(channelWebhookMap).length);
        } else {
            console.log('📂 No existing webhook mappings found, starting fresh');
        }
    } catch (error) {
        console.error('❌ Error loading webhook mappings:', error.message);
        channelWebhookMap = {};
    }
}

// Save webhook mappings to file
function saveWebhookMappings() {
    try {
        fs.writeFileSync(WEBHOOKS_FILE, JSON.stringify(channelWebhookMap, null, 2));
        console.log('💾 Saved webhook mappings to file');
    } catch (error) {
        console.error('❌ Error saving webhook mappings:', error.message);
    }
}

// Load source channel IDs from config or .env (supports unlimited channels)
let sourceChannelIds = [];
let channelCount = 0;
let channelMappings = {}; // Maps source channel ID to target channel ID

// Function to load channels from config
function loadChannelsFromConfig() {
    try {
        // Support both array format and object mapping format
        let newChannels = [];
        let newMappings = {};

        if (Array.isArray(config.channels)) {
            // Array format: ["channel_id_1", "channel_id_2"]
            newChannels = config.channels;
        } else if (typeof config.channels === 'object' && config.channels !== null) {
            // Object format: {"source_id": "target_id"}
            newChannels = Object.keys(config.channels);
            newMappings = config.channels;
        }

        const added = newChannels.filter(ch => !sourceChannelIds.includes(ch));
        const removed = sourceChannelIds.filter(ch => !newChannels.includes(ch));

        sourceChannelIds = [...newChannels];
        channelMappings = { ...newMappings };
        channelCount = sourceChannelIds.length;

        if (added.length > 0) {
            console.log(`✅ Added ${added.length} new channel(s):`, added);
        }
        if (removed.length > 0) {
            console.log(`🗑️ Removed ${removed.length} channel(s):`, removed);
        }

        console.log(`📊 Total channels loaded: ${channelCount}`);
        if (Object.keys(newMappings).length > 0) {
            console.log(`🗺️ Manual channel mappings: ${Object.keys(newMappings).length}`);
        }
        return true;
    } catch (error) {
        console.error('❌ Error loading channels from config:', error.message);
    }
    return false;
}

// Watch for changes to config.json
function watchChannelsFile() {
    watchConfigFile();
}

if (FULL_SERVER_COPY) {
    if (!SOURCE_GUILD_ID) {
        console.error('❌ FULL_SERVER_COPY enabled but SOURCE_GUILD_ID not configured!');
        process.exit(1);
    }
    console.log(`🌐 FULL SERVER COPY MODE enabled for server: ${SOURCE_GUILD_ID}`);
    console.log('📡 Will monitor ALL channels in the source server');
} else {
    console.log('🔍 Loading source channel IDs...');

    // First try loading from config.json
    const loadedFromConfig = loadChannelsFromConfig();

    // If config.json doesn't exist or is empty, fall back to .env
    if (!loadedFromConfig || channelCount === 0) {
        console.log('📝 Loading from .env file...');
        for (let i = 1; i <= 200; i++) {
            const channelKey = `CHANNEL_${i}`;
            const channelId = process.env[channelKey];

            if (!channelId) {
                if (channelCount > 0) {
                    break; // Stop if we've found channels and now hit a gap
                }
                continue; // Skip gaps in numbering
            }

            sourceChannelIds.push(channelId);
            channelCount++;
            console.log(`✅ Loaded source channel ${i}: ${channelId}`);
        }
    }

    // Start watching for changes to config.json
    if (fs.existsSync(CONFIG_FILE)) {
        watchChannelsFile();
    }

    if (channelCount === 0 && !(config.loopMessage && config.loopMessage.enabled)) {
        console.error('❌ No source channels configured! Add channels to config.json or CHANNEL_1, CHANNEL_2, etc. to .env');
        process.exit(1);
    }
}

if (!TARGET_GUILD_ID) {
    console.error('❌ TARGET_GUILD_ID not configured! Add it to config.json or .env');
    process.exit(1);
}

console.log(`\n📊 Mode: 🪝 WEBHOOK MIRROR`);
if (FULL_SERVER_COPY) {
    console.log(`🌐 Full server copy: ENABLED (Source: ${SOURCE_GUILD_ID})`);
} else {
    console.log(`📊 Total source channels to monitor: ${channelCount}`);
}
console.log(`🎯 Target guild ID: ${TARGET_GUILD_ID}`);
console.log(`🏗️ Auto-create channels: ${AUTO_CREATE_CHANNELS ? 'ENABLED' : 'DISABLED (using manual mappings)'}`);
if (TARGET_CATEGORY_ID) {
    console.log(`📁 Target category ID: ${TARGET_CATEGORY_ID}`);
}
if (COPY_CATEGORY_STRUCTURE) {
    console.log(`📋 Category structure copying: ENABLED`);
}

// Load existing webhook mappings
loadWebhookMappings();

// Function to get or create webhook for a source channel
async function getOrCreateWebhook(sourceChannel, discordClient) {
    const sourceChannelId = sourceChannel.id;
    const sourceChannelName = sourceChannel.name;

    console.log(`\n🔍 Processing channel: ${sourceChannelName} (${sourceChannelId})`);

    // Check if we already have a webhook for this channel
    if (channelWebhookMap[sourceChannelId] && channelWebhookMap[sourceChannelId].webhookUrl) {
        console.log(`✅ Using existing webhook for ${sourceChannelName}`);
        return channelWebhookMap[sourceChannelId].webhookUrl;
    }

    // If auto-create is disabled, check for manual mapping
    if (!AUTO_CREATE_CHANNELS) {
        const targetChannelId = channelMappings[sourceChannelId];

        if (!targetChannelId) {
            console.error(`❌ Auto-create disabled and no manual mapping found for ${sourceChannelName} (${sourceChannelId})`);
            console.error(`   Add mapping to config.json: { "channels": { "${sourceChannelId}": "target_channel_id" } }`);
            return null;
        }

        console.log(`🗺️ Using manual mapping to target channel: ${targetChannelId}`);

        try {
            const targetGuild = await discordClient.guilds.fetch(TARGET_GUILD_ID);
            const targetChannel = await targetGuild.channels.fetch(targetChannelId);

            if (!targetChannel) {
                console.error(`❌ Target channel not found: ${targetChannelId}`);
                return null;
            }

            console.log(`✅ Found target channel: ${targetChannel.name} (${targetChannelId})`);

            console.log(`🔗 Creating webhook in ${targetChannel.name}...`);
            const webhook = await targetChannel.createWebhook(BOT_USERNAME || 'Mirror Bot');
            console.log(`✅ Created webhook: ${webhook.url.substring(0, 50)}...`);

            // Store mapping
            channelWebhookMap[sourceChannelId] = {
                webhookUrl: webhook.url,
                targetChannelId: targetChannel.id,
                targetChannelName: targetChannel.name,
                sourceChannelName: sourceChannelName,
                createdAt: new Date().toISOString(),
                manualMapping: true
            };

            saveWebhookMappings();
            return webhook.url;

        } catch (error) {
            console.error(`❌ Error setting up manual mapping:`, error.message);
            return null;
        }
    }

    // Check if creation is already in progress for this channel
    if (creationLocks.has(sourceChannelId)) {
        console.log(`⏳ Waiting for existing creation process for ${sourceChannelName}...`);
        return await creationLocks.get(sourceChannelId);
    }

    console.log(`🆕 No webhook found, creating new channel and webhook...`);

    // Create a promise for this creation process and store it in the lock
    const creationPromise = (async () => {
        try {
            // Get target guild
            const targetGuild = await discordClient.guilds.fetch(TARGET_GUILD_ID);
            if (!targetGuild) {
                console.error(`❌ Could not fetch target guild: ${TARGET_GUILD_ID}`);
                return null;
            }

            console.log(`📍 Target guild: ${targetGuild.name}`);

            // Determine category for new channel
            let categoryId = TARGET_CATEGORY_ID;

            if (COPY_CATEGORY_STRUCTURE && sourceChannel.parent) {
                // Try to find or create matching category
                const sourceCategoryName = sourceChannel.parent.name;
                console.log(`📂 Source category: ${sourceCategoryName}`);

                let targetCategory = targetGuild.channels.cache.find(
                    c => c.type === 'GUILD_CATEGORY' && c.name === sourceCategoryName
                );

                if (!targetCategory) {
                    console.log(`🆕 Creating category: ${sourceCategoryName}`);
                    targetCategory = await targetGuild.channels.create(sourceCategoryName, {
                        type: 'GUILD_CATEGORY'
                    });
                } else {
                    console.log(`✅ Found existing category: ${sourceCategoryName}`);
                }

                categoryId = targetCategory.id;
            }

            // Check if channel with same name already exists
            let targetChannel = targetGuild.channels.cache.find(
                c => c.name === sourceChannelName && c.type === 'GUILD_TEXT'
            );

            if (!targetChannel) {
                console.log(`🆕 Creating channel: ${sourceChannelName}`);
                targetChannel = await targetGuild.channels.create(sourceChannelName, {
                    type: 'GUILD_TEXT',
                    parent: categoryId || undefined
                });
                console.log(`✅ Created channel: ${targetChannel.name} (${targetChannel.id})`);
            } else {
                console.log(`✅ Found existing channel: ${targetChannel.name} (${targetChannel.id})`);
            }

            console.log(`🔗 Creating webhook in ${targetChannel.name}...`);
            const webhook = await targetChannel.createWebhook(BOT_USERNAME || 'Mirror Bot');
            console.log(`✅ Created webhook: ${webhook.url.substring(0, 50)}...`);

            // Store mapping
            channelWebhookMap[sourceChannelId] = {
                webhookUrl: webhook.url,
                targetChannelId: targetChannel.id,
                targetChannelName: targetChannel.name,
                sourceChannelName: sourceChannelName,
                createdAt: new Date().toISOString()
            };

            saveWebhookMappings();

            return webhook.url;

        } catch (error) {
            console.error(`❌ Error creating webhook for ${sourceChannelName}:`, error.message);
            if (error.code) {
                console.error(`   Error code: ${error.code}`);
            }
            return null;
        } finally {
            // Remove the lock after completion (success or failure)
            creationLocks.delete(sourceChannelId);
        }
    })();

    // Store the promise in the lock map
    creationLocks.set(sourceChannelId, creationPromise);

    // Wait for and return the result
    return await creationPromise;
}

const client = new Client({
    checkUpdate: false
});

client.once('ready', async () => {
    console.log(`\n✅ Logged in as ${client.user.tag}`);

    // If full server copy mode, populate channel IDs from the source server
    if (FULL_SERVER_COPY && SOURCE_GUILD_ID) {
        try {
            const sourceGuild = await client.guilds.fetch(SOURCE_GUILD_ID);
            const guildChannels = await sourceGuild.channels.fetch();
            const textChannels = guildChannels.filter(ch => ch && ch.type === 'GUILD_TEXT'); // Text channels only
            sourceChannelIds = [...textChannels.keys()];
            console.log(`🌐 Loaded ${sourceChannelIds.length} text channels from source server: ${sourceGuild.name}`);
            textChannels.forEach(ch => console.log(`   - ${ch.name} (${ch.id})`));
        } catch (error) {
            console.error(`❌ Failed to load source server channels: ${error.message}`);
            process.exit(1);
        }
    }

    console.log(`📡 Monitoring ${sourceChannelIds.length} source channels`);
    console.log(`🔄 Ready to mirror messages!\n`);

    await startLoopMessage();
});

// Reusable forwarder: takes a message object and mirrors it, via webhook, to its
// mapped target channel. Used by both the live listener and the interval-based
// "loop message" feature below.
async function forwardMessage(message) {
    const webhookUrl = await getOrCreateWebhook(message.channel, client);

    if (!webhookUrl) {
        console.error(`❌ Failed to get webhook for channel ${message.channel.name}`);
        return;
    }

    try {
        const webhook = new WebhookClient({ url: webhookUrl });

        const payload = {
            username: BOT_USERNAME
        };

        // Text content (strip @everyone/@here to avoid accidental mass pings)
        if (message.content && message.content.length > 0) {
            payload.content = message.content
                .replace(/@everyone/g, '')
                .replace(/@here/g, '');
        }

        // All embeds, forwarded together (Discord allows up to 10 per message)
        if (message.embeds.length > 0) {
            payload.embeds = message.embeds.slice(0, 10).map(embed => ({
                title: embed.title || undefined,
                description: embed.description || undefined,
                url: embed.url || undefined,
                color: embed.color ?? undefined,
                timestamp: embed.timestamp || undefined,
                footer: embed.footer && embed.footer.text
                    ? { text: embed.footer.text, icon_url: embed.footer.iconURL || embed.footer.icon_url }
                    : undefined,
                image: embed.image ? { url: embed.image.url } : undefined,
                thumbnail: embed.thumbnail ? { url: embed.thumbnail.url } : undefined,
                author: embed.author
                    ? { name: embed.author.name, icon_url: embed.author.iconURL || embed.author.icon_url, url: embed.author.url }
                    : undefined,
                fields: embed.fields && embed.fields.length > 0 ? embed.fields : undefined
            }));
        }

        // All attachments, forwarded together (Discord allows up to 10 files per message)
        if (message.attachments.size > 0) {
            payload.files = Array.from(message.attachments.values())
                .slice(0, 10)
                .map(att => ({ attachment: att.url, name: att.name || undefined }));
        }

        if (!payload.content && !payload.embeds && !payload.files) {
            console.log('ℹ️ Nothing to forward (empty message)');
            return;
        }

        await webhook.send(payload);
        console.log(`✅ Message successfully mirrored from ${message.channel.name}\n`);

    } catch (error) {
        console.error(`❌ Error forwarding message from ${message.channel.name}:`, error.message);
    }
}

client.on('messageCreate', async message => {
    // Ignore our own messages
    if (message.author.id === client.user.id) {
        return;
    }

    // Check if this is a monitored source channel
    if (!sourceChannelIds.includes(message.channel.id)) {
        return;
    }

    console.log(`\n📨 Message received in ${message.channel.name} (${message.channel.id})`);
    console.log(`   Author: ${message.author.tag}`);
    console.log(`   Content: ${message.content ? message.content.substring(0, 50) + '...' : 'No text'}`);
    console.log(`   Embeds: ${message.embeds.length}, Attachments: ${message.attachments.size}`);

    await forwardMessage(message);
});

// ============================================================
// Loop-message feature: repeatedly re-copy one or more specific messages
// from a source channel to its mapped target channel, on an interval.
// Configure via config.json -> "loopMessage". Each message gets its own
// independent random schedule (so multiple messages don't stay in lockstep).
// ============================================================
let loopMessageTimers = []; // active setTimeout handles, one per looped message

function stopLoopMessage() {
    if (loopMessageTimers.length > 0) {
        loopMessageTimers.forEach(t => clearTimeout(t));
        loopMessageTimers = [];
        console.log('🛑 Stopped loop-message timers');
    }
}

// Schedules the next send of a specific message at baseMs + a random
// 0..jitterMs on top, then re-schedules itself after each send (so every
// gap is independently random, not just a fixed interval with one-time jitter).
function scheduleNextLoopSend(messageObj, baseMs, jitterMs) {
    const delay = baseMs + Math.floor(Math.random() * (jitterMs + 1));
    console.log(`⏱️ Next looped send of ${messageObj.id} in ~${Math.round(delay / 60000)} min`);

    const timer = setTimeout(async () => {
        console.log(`\n🔁 Re-sending looped message ${messageObj.id}...`);
        try {
            await forwardMessage(messageObj);
        } catch (error) {
            console.error(`❌ Loop-message send failed: ${error.message}`);
        }
        scheduleNextLoopSend(messageObj, baseMs, jitterMs);
    }, delay);

    loopMessageTimers.push(timer);
}

async function startLoopMessage() {
    const cfg = config.loopMessage;
    stopLoopMessage();

    if (!cfg || !cfg.enabled) {
        return;
    }

    // Support both the legacy single "messageId" field and the new "messageIds" array.
    const messageIds = [
        ...(Array.isArray(cfg.messageIds) ? cfg.messageIds : []),
        ...(cfg.messageId ? [cfg.messageId] : [])
    ].filter((id, index, arr) => id && arr.indexOf(id) === index); // de-dupe

    if (!cfg.sourceChannelId || messageIds.length === 0) {
        console.error('❌ loopMessage enabled but sourceChannelId/messageId(s) missing in config.json');
        return;
    }

    const baseMs = Math.max(1, cfg.intervalSeconds || 60) * 1000;
    const jitterMs = Math.max(0, cfg.randomJitterSeconds || 0) * 1000;

    // Make sure this channel is tracked so getOrCreateWebhook can map it
    if (!sourceChannelIds.includes(cfg.sourceChannelId)) {
        sourceChannelIds.push(cfg.sourceChannelId);
    }

    let sourceChannel;
    try {
        sourceChannel = await client.channels.fetch(cfg.sourceChannelId);
    } catch (error) {
        console.error(`❌ Failed to fetch loop-message source channel: ${error.message}`);
        return;
    }

    for (const messageId of messageIds) {
        let messageObj;
        try {
            messageObj = await sourceChannel.messages.fetch(messageId);
            console.log(`🔁 Loop-message armed: will re-copy message ${messageId} from #${sourceChannel.name} every ${baseMs / 1000}s (+0-${jitterMs / 1000}s random)`);
        } catch (error) {
            console.error(`❌ Failed to fetch loop-message ${messageId}: ${error.message}`);
            continue;
        }

        // Send once immediately on arm/startup, then continue on the random interval.
        console.log(`\n🔁 Sending initial copy of looped message ${messageObj.id}...`);
        try {
            await forwardMessage(messageObj);
        } catch (error) {
            console.error(`❌ Loop-message initial send failed: ${error.message}`);
        }

        scheduleNextLoopSend(messageObj, baseMs, jitterMs);
    }
}

client.login(TOKEN).catch(err => {
    console.error('❌ Failed to log in:', err.message);
    process.exit(1);
});

client.login(process.env.TOKEN);