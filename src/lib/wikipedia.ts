import mw from 'nodemw'
import { Emissions } from '@prisma/client'
import * as cheerio from 'cheerio'
import { WIKI_API_URL, EDIT_MSG_SUMMARY, REPORT_REFERENCE_NAME, KLIMATOLLEN_REFERENCE_NAME } from '../config/wikipedia'

const bot = new mw({
    protocol: "https",
    server: WIKI_API_URL,
    path: "/w",
    debug: false, // Set to true for verbose logging
    username: process.env.WIKI_USERNAME,
    password: process.env.WIKI_PASSWORD,
    userAgent: 'GarboBot/1.0'
})

bot.logIn((err) => {
    if (err) throw err
})

export async function getWikipediaContent(title: string): Promise<string> {
    return new Promise((resolve, reject) => {
        bot.getArticle(title, (err, data: string) => {
            if (err) reject(err)
            resolve(data)
        })
    })
}

async function updateWikipediaSection(title: string, content: string, section: string, csrfToken: string) {
    const params = {
        action: 'edit',
        title: title,
        appendtext: content,
        summary: EDIT_MSG_SUMMARY,
        bot: true,
        token: csrfToken as string,
        section: section
    }

    bot.api.call(
      params,
      (err, data) => {
        if (err) throw err
      },
      'POST'
    )
}
export async function updateWikipediaContent(title: string, content: { text: string, reportURL: string }) {
    const csrfToken = await new Promise((resolve, reject) => {
        bot.getToken(title, 'edit', (err, data) => {
            if (err) reject(err)
            resolve(data)
        })
    })

    const existingText = await getWikipediaContent(title)

    let contentToAdd: string = '\n\n<span id="klimatkollen-emissions-data">' + content.text + generateWikipediaReference(content.reportURL, title) + '</span>'

    const $ = cheerio.load(existingText)
    const textExists = $('span#klimatkollen-emissions-data').length > 0

    if (!textExists) {
        await updateWikipediaSection(title, contentToAdd, '0', csrfToken as string)
        return
    }

    $('span#klimatkollen-emissions-data').each((i, el) => {
        $(el).html(content.text + generateWikipediaReference(content.reportURL, title))
    })
    contentToAdd = $('body').html() as string

    bot.edit(title, contentToAdd, EDIT_MSG_SUMMARY, (err, data) => {
        if (err) throw err
    })
}

export function generateWikipediaReference(url: string, title: string, date?: string, accessDate?: string): string {
    const reportRefParams = [
        `url=${url}`,
        `title=${title}`,
        date ? `date=${date}` : '',
        accessDate ? `access-date=${accessDate}` : ''
    ].filter(Boolean).join(' |');

    const klimatkollenRefParams = [
        'url=https://www.klimatkollen.se/',
        'title=Klimatkollen - Emissions Data',
        date ? `date=${date}` : '',
        accessDate ? `access-date=${accessDate}` : ''
    ].filter(Boolean).join(' |');

    const klimatkollenReference = `<ref name="${KLIMATOLLEN_REFERENCE_NAME}">{{cite web |${klimatkollenRefParams}}}</ref>`
    const reportReference = url ? `<ref name="${REPORT_REFERENCE_NAME}">{{cite web |${reportRefParams}}}</ref>` : ''
    return klimatkollenReference + reportReference
}

export function generateWikipediaInfoBox(emissions: Emissions, language: string): string {
    //TODO: update this when there is an infobox template for emissions data
    switch (language) {
        case "en":
            return `{{Infobox company
                | scope1 = ${emissions.statedTotalEmissions?.total} ${emissions.statedTotalEmissions?.unit}
            }}`
        case "sv":
            return `{{Faktamall företag
                | scope1 = ${emissions.statedTotalEmissions?.total} ${emissions.statedTotalEmissions?.unit}
            }}`
        default:
            throw new Error(`Unsupported language: ${language}`)
    }
}

export function generateWikipediaArticleText(emissions: Emissions, title: string, year: string, language: string): string {
    switch (language) {
        case "en":
            let enText = `During ${year} the total amount of greenhouse gas emissions generated by ${title} added up to`
            if (emissions.statedTotalEmissions.total && emissions.statedTotalEmissions.unit) {
                enText += ` ${emissions.statedTotalEmissions.total} ${emissions.statedTotalEmissions.unit}`
            }
            if (emissions.scope1.total || emissions.scope2.lb || emissions.scope2.mb || emissions.scope3.statedTotalEmissions.total) {
                enText += ', of which'
            }
            if (emissions.scope1?.total && emissions.scope1?.unit) {
                enText += ` ${emissions.scope1.total} ${emissions.scope1.unit} in scope 1`
            }
            if (emissions.scope2?.mb && emissions.scope2?.unit) {
                if (emissions.scope1?.total) enText += ','
                enText += ` ${emissions.scope2.mb} ${emissions.scope2.unit} in scope 2`
            }
            if (!emissions.scope2?.mb && emissions.scope2?.unit && emissions.scope2?.lb) {
                if (emissions.scope1?.total) enText += ','
                enText += ` ${emissions.scope2.lb} ${emissions.scope2.unit} in scope 2`
            }
            if (emissions.scope3?.statedTotalEmissions.total && emissions.scope3?.statedTotalEmissions.unit) {
                if (emissions.scope1?.total || emissions.scope2?.mb || emissions.scope2?.lb) enText += ', and'
                enText += ` ${emissions.scope3.statedTotalEmissions.total} ${emissions.scope3.statedTotalEmissions.unit} in scope 3`
            }
            enText += '.'
            return enText
        case "sv":
            let svText = `Under ${year} uppgick de totala utsläppen av växthusgaser för ${title} till`
            if (emissions.statedTotalEmissions.total && emissions.statedTotalEmissions.unit) {
                svText += ` ${emissions.statedTotalEmissions.total} ${emissions.statedTotalEmissions.unit}`
            }
            if (emissions.scope1.total || emissions.scope2.lb || emissions.scope2.mb || emissions.scope3.statedTotalEmissions.total) {
                svText += ', varav'
            }
            if (emissions.scope1?.total && emissions.scope1?.unit) {
                svText += ` ${emissions.scope1.total} ${emissions.scope1.unit} i scope 1`
            }
            if (emissions.scope2?.mb && emissions.scope2?.unit) {
                if (emissions.scope1?.total) svText += ','
                svText += ` ${emissions.scope2.mb} ${emissions.scope2.unit} i scope 2`
            }
            if (!emissions.scope2?.mb && emissions.scope2?.unit && emissions.scope2?.lb) {
                if (emissions.scope1?.total) svText += ','
                svText += ` ${emissions.scope2.lb} ${emissions.scope2.unit} i scope 2`
            }
            if (emissions.scope3?.statedTotalEmissions.total && emissions.scope3?.statedTotalEmissions.unit) {
                if (emissions.scope1?.total || emissions.scope2?.mb || emissions.scope2?.lb) svText += ' och'
                svText += ` ${emissions.scope3.statedTotalEmissions.total} ${emissions.scope3.statedTotalEmissions.unit} i scope 3`
            }
            svText += '.'
            return svText
        default:
            throw new Error(`Unsupported language: ${language}`)
    }
}