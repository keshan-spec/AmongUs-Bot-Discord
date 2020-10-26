import { DiscordBot } from './bot';

require('dotenv').config();

const bot = DiscordBot.getInstance();

bot.connect()