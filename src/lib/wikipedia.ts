import mw from 'nodemw'

const WIKI_API_URL = "test.wikipedia.org"
const EDIT_MSG_SUMMARY = "Bot: Update emissions data"

const bot = new mw({
    protocol: "https",
    server: WIKI_API_URL,
    path: "/w",
    debug: true,
})

export async function getWikipediaContent(title: string) {
    return new Promise((resolve, reject) => {
        bot.getArticle(title, (err, data) => {
            if (err) reject(err)
            resolve(data)
        })
    })
}

export async function updateWikipediaContent(title: string, content: string) {
    //TODO: Update more attributes if needed
    return new Promise((resolve, reject) => {
        bot.append(title, content, EDIT_MSG_SUMMARY, (err, data) => {
            if (err) reject(err)
            resolve(data)
        })
    })
}

