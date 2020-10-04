#!/usr/bin/node
const {TelegramBot} = require("./src/telegramBot")
const {Db} = require('./src/db')

const dotenv = require('dotenv')
const result = dotenv.config()

if (result.error) {
    throw result.error
}

const db = new Db({connectionUrl: process.env.DB_CONNECTION})
const bot = new TelegramBot({token: process.env.BOT_TOKEN, db: db})

bot.start()
    .then(() => console.log("start bot"))