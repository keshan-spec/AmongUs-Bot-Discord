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
            var _a;
            console.log(`Logged in as ${(_a = this.client.user) === null || _a === void 0 ? void 0 : _a.tag}!`);
            // this.client.guilds.cache.forEach((server) => { console.log(server.id, server.name) })
        });
    }
    ;
    async commandHandler(message) {
        var _a, _b;
        let command, args;
        [command, ...args] = message.content
            .trim()
            .substring(this.PREFIX.length)
            .split(/\s+/);
        if (command == "help") {
            await message.reply("Commands .. im lazy man");
        }
        if (command == "invite")
            await message.reply(this.invite);
        if (command === "begin") { // start game
            const voice = (_a = message.member) === null || _a === void 0 ? void 0 : _a.voice.channel;
            const user = message.author.id;
            if (this.occupiedInstances.get(user)) {
                return;
            }
            if (voice) {
                let instance = {
                    boundchannel: voice,
                    deadPlayers: []
                };
                this.occupiedInstances.set(user, instance); // create a new user instance 
                await message.reply("Starting game, Bound to channel");
                return;
            }
            await message.reply("Please connect to a voice channel");
        }
        if (command === "muteall") { // muteall members
            let instance = this.occupiedInstances.get(message.author.id);
            if (instance) {
                for (const [_, member] of instance.boundchannel.members) {
                    member.voice.setMute(true)
                        .then(_ => console.log(`Muted ${member.user.tag}`))
                        .catch((err) => console.error(err));
                }
            }
        }
        if (command === "meeting") { // unmuteall members
            let instance = this.occupiedInstances.get(message.author.id);
            if (instance) {
                for (const [_, member] of instance.boundchannel.members) {
                    if (instance.deadPlayers.includes(member.id))
                        continue;
                    member.voice.setMute(false)
                        .then(_ => console.log(`Unmuted ${member.user.tag}`))
                        .catch((err) => console.error(err));
                }
            }
        }
        if (command === "dead") { // mute one member
            let instance = this.occupiedInstances.get(message.author.id);
            if (instance) {
                if (args[0]) {
                    let mention = (_b = message.mentions.members) === null || _b === void 0 ? void 0 : _b.first();
                    if (mention) {
                        instance.deadPlayers.push(mention.user.id);
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
        }
        if (command === "re") { // reset game variables
            let instance = this.occupiedInstances.get(message.author.id);
            if (instance) {
                instance.deadPlayers = [];
                for (const [_, member] of instance.boundchannel.members) {
                    member.voice.setMute(false)
                        .then(_ => console.log(`Unmuted ${member.user.tag}`))
                        .catch((err) => console.error(err));
                }
                await message.reply("Nice lets start again");
            }
        }
        if (command === "close") { // reset game 
            let instance = this.occupiedInstances.get(message.author.id);
            if (instance) {
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
