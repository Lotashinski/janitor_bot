const {Telegraf} = require('telegraf')
const {logManager} = require('./logger')
const rateLimit = require('telegraf-ratelimit')

class TelegramBot {
    #bot;

    /**
     * @param token
     * @param {Db} db
     */
    constructor({token, db}) {
        logManager.getLogger().debug("construct bot")
        const telegraf = new Telegraf(token)

        const limitConfig = {
            window: 500,
            limit: 10,
            onLimitExceeded: (ctx, next) => ctx.reply('Меньше флуда! Сервера не казенные Блеать!')
                .then(res => db.insertMessage({chat_id: ctx.chat.id, message_id: res.message_id}))
        }

        telegraf.use(rateLimit(limitConfig))

        telegraf.start(async (ctx) => {
            logManager.getLogger().debug("bot call start")
            await ctx.reply("Готов работать за еду и воду. Блеать")
        })

        const cleaner = async ({chat_id, telegram}) => {
            const {rows} = await db.getActiveMessages({chat_id: chat_id})

            const del = async (chat_id, message_id) => {
                try {
                    await telegram.deleteMessage(chat_id, message_id)
                    await db.dropMessage({chat_id: chat_id, message_id: message_id})
                } catch (e) {
                    try {
                        await db.setMessagesWithError({chat_id: chat_id, message_id: message_id})
                    }catch (e){
                        logManager.getLogger().error(`error in janitor ${JSON.stringify(e)}`)
                    }
                    logManager.getLogger().error(`error in janitor ${JSON.stringify(e)}`)
                }
            }

            for (let i = 0; i < rows.length; ++i)
                await del(chat_id, rows[i].message_id)

        }

        const texter = async (ctx) => {
            if (ctx.message.text.indexOf("Работай") !== -1) {
                const res = await ctx.reply("Сам работай")
                await db.insertMessage({chat_id: ctx.chat.id, message_id: res.message_id})
            } else if (ctx.message.text.indexOf("плющердоновище") !== -1) {
                await cleaner({chat_id: ctx.chat.id, telegram: ctx.telegram})
            } else if (ctx.message.text.indexOf("Буся") !== -1) {
                const res = await ctx.reply("Чмок")
                await db.insertMessage({chat_id: ctx.chat.id, message_id: res.message_id})
            }
        }

        telegraf.on('message', async (ctx) => {
            try {
                logManager.getLogger().debug(`bot message[${ctx.chat.id | ctx.message.message_id}]`)
                await db.insertMessage({chat_id: ctx.chat.id, message_id: ctx.message.message_id})
                if (ctx.message.text !== undefined)
                    await texter(ctx)
            } catch (ex) {
                await ctx.replyWithHTML('<b>Блять! Я упал</b>')
            }
        })

        this.#bot = telegraf;
    }

    async start() {
        return this.#bot.startPolling()
    }

}

module.exports.TelegramBot = TelegramBot