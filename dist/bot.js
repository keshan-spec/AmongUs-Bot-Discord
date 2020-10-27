"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordBot = void 0;
const discord_js_1 = require("discord.js");
class DiscordBot {
    constructor() {
        this.PREFIX = "au";
        this.invite = "https://discord.com/api/oauth2/authorize?client_id=770288825091620864&permissions=8&scope=bot";
        this.occupiedInstances = new Map(); // Map<string, instances>;
        this.client = new discord_js_1.Client({ partials: ["MESSAGE", "REACTION"] });
        this.initializeCient();
    }
    static getInstance() {
        if (!DiscordBot.instance) {
            DiscordBot.instance = new DiscordBot();
        }
        return DiscordBot.instance;
    }
    connect() {
        this.client
            .login(process.env.D_TOKEN)
            .then(_ => console.log('Connected to Discord'))
            .catch(error => console.error(`Could not connect. Error: ${error.message}`));
    }
    initializeCient() {
        if (!this.client)
            return;
        this.setReadyHandler();
        this.setMessageHandler();
        this.setVoiceHandler();
    }
    setReadyHandler() {
        this.client.on('ready', () => {
            var _a, _b;
            console.log(`Logged in as ${(_a = this.client.user) === null || _a === void 0 ? void 0 : _a.tag}!`);
            (_b = this.client.user) === null || _b === void 0 ? void 0 : _b.setActivity(`In ${this.client.guilds.cache.size} servers | auhelp`, { type: "PLAYING" }).then(presence => console.log(`Activity set to ${presence.activities[0].name}`)).catch(err => console.error(err));
        });
    }
    ;
    getChannelBound(voice_id) {
        var temp = true;
        this.occupiedInstances.forEach((v, k) => {
            if (v.boundchannel.id === voice_id) {
                temp = false;
            }
        });
        return temp;
    }
    async helpEmbed(message) {
        let embed = new discord_js_1.MessageEmbed();
        embed.setColor(13378082);
        embed.setDescription("**Bot Prefix** : au\n\nThe following are the commands without the prefix");
        embed.addField("begin", "Run this command once you've joined a voice channel to bound the bot to that channel");
        embed.addField("muteall", "This command is used to muteall players during the game");
        embed.addField("meeting", "This command is used when meetings are called ingame. Unmutes all players");
        embed.addField("dead <mention user>", "This command is used to mark a *mentioned* user as dead, and will remain muted during meetings ");
        embed.addField("re", "Use this command when you start a new game/round");
        embed.addField("help", "This command is used to mark a *mentioned* user as dead, and will remain muted during meetings ");
        embed.addField("invite", "Provides an invite url for the bot");
        await message.channel.send(embed);
    }
    async commandHandler(message) {
        var _a, _b;
        let command, args;
        [command, ...args] = message.content
            .trim()
            .substring(this.PREFIX.length)
            .split(/\s+/);
        if (command === "help")
            this.helpEmbed(message); // helper command
        if (command === "invite") { // invite command
            await message.channel.send(new discord_js_1.MessageEmbed()
                .setColor("#30afe3")
                .setTitle("Use this link to invite this bot to your server!")
                .setDescription(this.invite));
        }
        if (command === "begin") { // start game
            const voice = (_a = message.member) === null || _a === void 0 ? void 0 : _a.voice.channel;
            const user = message.author.id;
            if (this.occupiedInstances.get(user))
                return; // prevent user from starting without closing a game
            if (voice) {
                if (this.getChannelBound(voice.id) == false) { // check if a user is already bound to the voice channel
                    await message.reply("This channel is already occupied");
                    return;
                }
                let instance = {
                    boundchannel: voice,
                    deadPlayers: [] // dead players in a match
                };
                this.occupiedInstances.set(user, instance); // create a new user instance 
                await message.reply("Starting game, Bound to channel");
                return;
            }
            await message.reply("Please connect to a voice channel");
        }
        // the following commands are run after the instance is created
        // therefore this statement will act as a clause
        let instance = this.occupiedInstances.get(message.author.id);
        if (instance == null)
            return;
        if (command === "muteall") { // muteall members
            for (const [_, member] of instance.boundchannel.members) {
                member.voice.setMute(true)
                    .then(_ => console.log(`Muted ${member.user.tag}`))
                    .catch((err) => console.error(err));
            }
        }
        if (command === "meeting") { // unmuteall members
            for (const [_, member] of instance.boundchannel.members) {
                if (instance.deadPlayers.includes(member.id))
                    continue; // if the player is dead then keep them muted
                member.voice.setMute(false)
                    .then(_ => console.log(`Unmuted ${member.user.tag}`))
                    .catch((err) => console.error(err));
            }
        }
        if (command === "dead") { // mute one member
            if (args[0]) {
                let mention = (_b = message.mentions.members) === null || _b === void 0 ? void 0 : _b.first();
                if (mention) {
                    instance.deadPlayers.push(mention.user.id); // add a dead player
                    for (const [_, member] of instance.boundchannel.members) {
                        if ((mention === null || mention === void 0 ? void 0 : mention.user.id) === member.id) {
                            member.voice.setMute(true)
                                .then(_ => console.log(`Muted ${member.user.tag}`))
                                .catch((err) => console.error(err));
                        }
                    }
                }
            }
            else {
                await message.reply("Command requires a user mention");
            }
        }
        if (command === "re") { // reset game variables
            instance.deadPlayers = [];
            for (const [_, member] of instance.boundchannel.members) {
                member.voice.setMute(false)
                    .then(_ => console.log(`Unmuted ${member.user.tag}`))
                    .catch((err) => console.error(err));
            }
            await message.reply("Nice lets start again");
        }
        if (command === "close") { // reset game 
            // unmute and disconnect everyone
            for (const [_, member] of instance.boundchannel.members) {
                member.voice.setMute(false)
                    .then(_ => console.log(`Unmuted ${member.user.tag}`))
                    .catch((err) => console.error(err));
                member.voice.kick();
            }
            // remove instance
            this.occupiedInstances.delete(message.author.id);
            await message.reply("Nice playing, Bye!!");
        }
        return;
    }
    setMessageHandler() {
        this.client.on('message', async (message) => {
            //* filters out requests from bots
            if (message.author.bot)
                return;
            if (message.content.startsWith(this.PREFIX))
                this.commandHandler(message);
        });
    }
    setVoiceHandler() {
        this.client.on("voiceStateUpdate", (oldVoiceState, newVoiceState) => {
            var _a, _b, _c, _d, _e, _f;
            if ((_a = newVoiceState.channel) === null || _a === void 0 ? void 0 : _a.id)
                console.log(`${(_b = newVoiceState.member) === null || _b === void 0 ? void 0 : _b.user.tag} connected to ${(_c = newVoiceState.channel) === null || _c === void 0 ? void 0 : _c.name}.`);
            else if ((_d = oldVoiceState.channel) === null || _d === void 0 ? void 0 : _d.id)
                console.log(`${(_e = oldVoiceState.member) === null || _e === void 0 ? void 0 : _e.user.tag} disconnected from ${(_f = oldVoiceState.channel) === null || _f === void 0 ? void 0 : _f.name}.`);
        });
    }
}
exports.DiscordBot = DiscordBot;
