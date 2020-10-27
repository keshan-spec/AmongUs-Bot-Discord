import { Client, Message, VoiceChannel } from 'discord.js';

type instances = {
    boundchannel?: VoiceChannel | null,
    begin?: boolean,
    deadPlayers: string[]
}

export class DiscordBot {
    private static instance: DiscordBot;
    private PREFIX = "au";
    private invite = "https://discord.com/api/oauth2/authorize?client_id=770288825091620864&permissions=8&scope=bot";
    private occupiedInstances = new Map() // Map<string, instances>;


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
            // this.client.guilds.cache.forEach((server) => { console.log(server.id, server.name) })
        });
    };

    private getChannelBound(voice_id: string): boolean {
        var temp = true
        this.occupiedInstances.forEach((v, k) => {
            if (v.boundchannel.id === voice_id) {
                temp = false
            }
        })
        return temp
    }

    private async commandHandler(message: Message) {
        let command: any, args: any;
        [command, ...args] = message.content
            .trim()
            .substring(this.PREFIX.length)
            .split(/\s+/)

        if (command == "help") {
            await message.reply("Commands .. im lazy man")
        }
        if (command == "invite") await message.reply(this.invite)

        if (command === "begin") { // start game
            const voice = message.member?.voice.channel
            const user = message.author.id

            if (this.occupiedInstances.get(user)) return // prevent user from starting without closing a game

            if (voice) {
                if (this.getChannelBound(voice.id) == false) { // check if a user is already bound to the voice channel
                    await message.reply("This channel is already occupied")
                    return
                }
                let instance: instances = { // create new instance
                    boundchannel: voice, // Voice channel
                    deadPlayers: [] // dead players in a match
                }

                this.occupiedInstances.set(user, instance) // create a new user instance 
                await message.reply("Starting game, Bound to channel")
                return
            }
            await message.reply("Please connect to a voice channel")
        }

        if (command === "muteall") { // muteall members
            let instance = this.occupiedInstances.get(message.author.id)
            if (instance) {
                for (const [_, member] of instance.boundchannel.members) {
                    member.voice.setMute(true)
                        .then(_ => console.log(`Muted ${member.user.tag}`))
                        .catch((err) => console.error(err))
                }
            }
        }
        if (command === "meeting") { // unmuteall members
            let instance = this.occupiedInstances.get(message.author.id)
            if (instance) {
                for (const [_, member] of instance.boundchannel.members) {
                    if (instance.deadPlayers.includes(member.id)) continue
                    member.voice.setMute(false)
                        .then(_ => console.log(`Unmuted ${member.user.tag}`))
                        .catch((err) => console.error(err))
                }
            }
        }
        if (command === "dead") { // mute one member
            let instance = this.occupiedInstances.get(message.author.id)
            if (instance) {
                if (args[0]) {
                    let mention = message.mentions.members?.first()
                    if (mention) {
                        instance.deadPlayers.push(mention.user.id)
                        for (const [_, member] of instance.boundchannel.members) {
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
        }
        if (command === "re") { // reset game variables
            let instance = this.occupiedInstances.get(message.author.id)
            if (instance) {
                instance.deadPlayers = []
                for (const [_, member] of instance.boundchannel.members) {
                    member.voice.setMute(false)
                        .then(_ => console.log(`Unmuted ${member.user.tag}`))
                        .catch((err) => console.error(err))
                }
                await message.reply("Nice lets start again")
            }
        }
        if (command === "close") { // reset game 
            let instance = this.occupiedInstances.get(message.author.id)
            if (instance) {
                // unmute and disconnect everyone
                for (const [_, member] of instance.boundchannel.members) {
                    member.voice.setMute(false)
                        .then(_ => console.log(`Unmuted ${member.user.tag}`))
                        .catch((err) => console.error(err))
                    member.voice.kick()
                }
                // remove instance
                this.occupiedInstances.delete(message.author.id)
                await message.reply("Nice playing, Bye!!")
            }

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
            if (newVoiceState.channel?.id) // The member connected to a channel.
                console.log(`${newVoiceState.member?.user.tag} connected to ${newVoiceState.channel?.name}.`);
            else if (oldVoiceState.channel?.id)  // The member disconnected from a channel.
                console.log(`${oldVoiceState.member?.user.tag} disconnected from ${oldVoiceState.channel?.name}.`)
        });
    }
}