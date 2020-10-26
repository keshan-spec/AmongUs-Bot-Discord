"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bot_1 = require("./bot");
require('dotenv').config();
const bot = bot_1.DiscordBot.getInstance();
bot.connect();
