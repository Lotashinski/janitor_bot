const {Client, Pool} = require('pg')
const {logManager} = require('./logger')

class Db {

    #pgClient

    constructor({connectionUrl}) {
        logManager.getLogger().debug(`create Db ${connectionUrl}`)
        this.#pgClient = new Pool({connectionString: connectionUrl})
    }

    async #connect() {
        logManager.getLogger().debug("connect to db")
        // await this.#pgClient.connect()
    }

    async #disconnect() {
        logManager.getLogger().debug("disconnect to db")
        // await this.#pgClient.end()
    }

    async getChats() {
        try {
            await this.#connect()
            return await this.#pgClient.query(
                '\
SELECT DISTINCT chat_id\n\
FROM messages\n\
ORDER BY chat_id ASC\
')

        } catch (ex) {
            logManager.getLogger().fatal(`ex in DB: ${JSON.stringify(ex)}`)
            throw ex
        } finally {
            await this.#disconnect()
        }
    }

    async getActiveMessages({chat_id}) {
        try {
            await this.#connect()

            const sql = '\
SELECT message_id\n\
FROM messages\n\
WHERE chat_id = $1\n\
    AND status LIKE \'ACTIVE\'\n\
ORDER BY message_id ASC'

            const values = [chat_id]

            return await this.#pgClient.query(sql, values)
        } catch (ex) {
            logManager.getLogger().fatal(`ex in DB: ${JSON.stringify(ex)}`)
            throw ex
        } finally {
            await this.#disconnect()
        }
    }

    async insertMessage({chat_id, message_id}) {
        try {
            await this.#connect()

            const sql = '\
INSERT INTO messages (chat_id, message_id, status)\n\
VALUES ($1, $2, $3)\n\
RETURNING *'

            const values = [chat_id, message_id, 'ACTIVE']

            return await this.#pgClient.query(sql, values)
        } catch (ex) {
            logManager.getLogger().fatal(`ex in DB: ${JSON.stringify(ex)}`)
            throw ex
        } finally {
            await this.#disconnect()
        }
    }

    async dropMessage({chat_id, message_id}) {
        try {
            await this.#connect()

            const sql = '\
UPDATE messages\n\
SET status = \'DELETE\'\n\
WHERE chat_id = $1\n\
    AND message_id = $2\n\
    AND status LIKE \'ACTIVE\'\n\
RETURNING *'

            const values = [chat_id, message_id]

            return await this.#pgClient.query(sql, values)
        } catch (ex) {
            logManager.getLogger().fatal(`ex in DB: ${JSON.stringify(ex)}`)
            throw ex
        } finally {
            await this.#disconnect()
        }
    }

    async setMessagesWithError({chat_id, message_id}){
        try {
            await this.#connect()

            const sql = '\
UPDATE messages\n\
SET status = \'ERROR\'\n\
WHERE chat_id = $1\n\
    AND message_id = $2\n\
    AND status LIKE \'ACTIVE\'\n\
RETURNING *'

            const values = [chat_id, message_id]

            return await this.#pgClient.query(sql, values)
        } catch (ex) {
            logManager.getLogger().fatal(`ex in DB: ${JSON.stringify(ex)}`)
            throw ex
        } finally {
            await this.#disconnect()
        }
    }

}

module.exports.Db = Db