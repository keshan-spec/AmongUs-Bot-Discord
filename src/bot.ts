import { Client, Message, VoiceChannel } from 'discord.js';

export class DiscordBot {
    private static instance: DiscordBot;
    private PREFIX = "au";
    private begin = false;
    private deadPlayers: string[] = [];
    private boundChannel: VoiceChannel;

    private client: Client = new Client({ partials: ["MESSAGE", "REACTION"] });

    private constructor() {
        this.initializeCient();
    }

    static getInstance(): DiscordBot {
        if (!DiscordBot.instance) {
            DiscordBot.instance = new DiscordBot();
        }
        return DiscordBot.instance;
    }

    connect(): void {
        this.client
            .login(process.env.D_TOKEN)
            .then(_ => console.log('Connected to Discord'))
            .catch(error => console.error(`Could not connect. Error: ${error.message}`)
            );
    }

    private initializeCient(): void {
        if (!this.client) return;

        this.setReadyHandler();
        this.setMessageHandler();
        this.setVoiceHandler();
    }

    private setReadyHandler(): void {
        this.client.on('ready', () => {
            console.log(`Logged in as ${this.client.user?.tag}!`);
        });
    };

    private async commandHandler(message: Message) {
        let command: any, args: any;
        [command, ...args] = message.content
            .trim()
            .substring(this.PREFIX.length)
            .split(/\s+/)

        if (command == "help") {
            await message.reply("Commands .. im lazy man")
        }

        if (command === "begin" && this.begin != true) { // start game
            const voice = message.member?.voice.channel
            if (voice) {
                this.boundChannel = voice
                this.boundAuthor = message.author.id
                await message.reply("Starting game, Bound to channel")
                this.begin = true
                return
            }
            await message.reply("Please connect to a voice channel")
        }
        // return if there is no current game runnning
        if (this.begin != true) return

        if (command === "muteall") { // muteall members
            for (const [_, member] of this.boundChannel.members) {
                member.voice.setMute(true)
                    .then(_ => console.log(`Muted ${member.user.tag}`))
                    .catch((err) => console.error(err))
            }
        }
        if (command === "meeting") { // muteall members
            for (const [_, member] of this.boundChannel.members) {
                if (this.deadPlayers.includes(member.id)) continue
                member.voice.setMute(false)
                    .then(_ => console.log(`Unmuted ${member.user.tag}`))
                    .catch((err) => console.error(err))
            }
        }
        if (command === "dead") { // mute one member
            if (args[0]) {
                let mention = message.mentions.members?.first()
                if (mention) {
                    this.deadPlayers.push(mention.user.id)
                    for (const [_, member] of this.boundChannel.members) {
                        if (mention?.user.id === member.id) {
                            member.voice.setMute(true)
                                .then(_ => console.log(`Muted ${member.user.tag}`))
                                .catch((err) => console.error(err))
                        }
                    }
                }
            } else {
                await message.reply("Command requires a user mention")
            }

        }
        if (command === "re" && this.begin) { // reset game variables
            this.deadPlayers = []
            for (const [_, member] of this.boundChannel.members) {
                member.voice.setMute(false)
                    .then(_ => console.log(`Unmuted ${member.user.tag}`))
                    .catch((err) => console.error(err))
            }
            await message.reply("Nice lets start again")
        }
        if (command === "close" && this.begin) { // reset game 
            // unmute and disconnect everyone
            for (const [_, member] of this.boundChannel.members) {
                member.voice.setMute(false)
                    .then(_ => console.log(`Unmuted ${member.user.tag}`))
                    .catch((err) => console.error(err))
                member.voice.kick()
            }

            // reset variables
            this.boundChannel = null
            this.begin = false
            await message.reply("Nice playing, Bye!!")
        }
        return
    }

    private setMessageHandler(): void {
        this.client.on('message', async (message: Message) => {
            //* filters out requests from bots
            if (message.author.bot) return;
            if (message.content.startsWith(this.PREFIX)) this.commandHandler(message)
        });
    }

    private setVoiceHandler(): void {
        this.client.on("voiceStateUpdate", (oldVoiceState, newVoiceState) => { // Listeing to the voiceStateUpdate event
            if (this.begin) {
                if (newVoiceState.channel?.id == this.boundChannel.id) // The member connected to a channel.
                    console.log(`${newVoiceState.member?.user.tag} connected to ${newVoiceState.channel?.name}.`);
                else if (oldVoiceState.channel?.id == this.boundChannel.id)  // The member disconnected from a channel.
                    console.log(`${oldVoiceState.member?.user.tag} disconnected from ${oldVoiceState.channel?.name}.`)
            }
        });
    }
}