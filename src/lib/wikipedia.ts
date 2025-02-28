import mw from 'nodemw'
import { Emissions } from '@prisma/client'
import * as cheerio from 'cheerio'

const WIKI_API_URL = "test.wikipedia.org"
const EDIT_MSG_SUMMARY = "Bot: Update emissions data"
const REPORT_REFERENCE_NAME = "klimatkollen-emissions-report-reference"
const KLIMATOLLEN_REFERENCE_NAME = "klimatkollen-emissions-reference"

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
    //TODO: call this in updateWikipediaContent
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

export function generateWikipediaArticleText(emissions: Emissions, language: string): string {
    switch (language) {
        case "en":
            let enText = 'During the period'
            if (emissions.reportingPeriod?.startDate && emissions.reportingPeriod?.endDate) {
                enText += ` ${emissions.reportingPeriod.startDate.toLocaleDateString('en-GB')} - ${emissions.reportingPeriod.endDate.toLocaleDateString('en-GB')}`
            }
            enText += ' the company generated'
            if (emissions.scope1?.total && emissions.scope1?.unit) {
                enText += ` ${emissions.scope1.total} ${emissions.scope1.unit} in scope 1 emissions`
            }
            if (emissions.scope2?.mb && emissions.scope2?.unit) {
                if (emissions.scope1?.total) enText += ','
                if (emissions.scope2.mb) {
                    enText += ` ${emissions.scope2.mb} ${emissions.scope2.unit} in market-based scope 2 emissions`
                }
                if (emissions.scope2.lb) {
                    if (emissions.scope1?.total || emissions.scope2.mb) enText += ','
                    enText += ` ${emissions.scope2.lb} ${emissions.scope2.unit} in location-based scope 2 emissions`
                }
            }
            if (emissions.scope3?.total && emissions.scope3?.unit) {
                if (emissions.scope1?.total || emissions.scope2?.mb) enText += ','
                enText += ` ${emissions.scope3.total} ${emissions.scope3.unit} in scope 3 emissions`
            }
            enText += '.'
            return enText
        case "sv":
            let svText = 'Under perioden'
            if (emissions.reportingPeriod?.startDate && emissions.reportingPeriod?.endDate) {
                svText += ` ${emissions.reportingPeriod.startDate.toLocaleDateString('sv-SE')} - ${emissions.reportingPeriod.endDate.toLocaleDateString('sv-SE')}`
            }
            svText += ' genererade företaget'
            if (emissions.scope1?.total && emissions.scope1?.unit) {
                svText += ` ${emissions.scope1.total} ${emissions.scope1.unit} i scope 1-utsläpp`
            }
            if (emissions.scope2?.mb && emissions.scope2?.unit) {
                if (emissions.scope1?.total) svText += ','
                if (emissions.scope2.mb) {
                    svText += ` ${emissions.scope2.mb} ${emissions.scope2.unit} i marknadsbaserade scope 2-utsläpp`
                }
                if (emissions.scope2.lb) {
                    if (emissions.scope1?.total || emissions.scope2.mb) svText += ','
                    svText += ` ${emissions.scope2.lb} ${emissions.scope2.unit} i platsbaserade scope 2-utsläpp`
                }
            }
            if (emissions.scope3?.total && emissions.scope3?.unit) {
                if (emissions.scope1?.total || emissions.scope2?.mb) svText += ','
                svText += ` ${emissions.scope3.total} ${emissions.scope3.unit} i scope 3-utsläpp`
            }
            svText += '.'
            return svText
        default:
            throw new Error(`Unsupported language: ${language}`)
    }
}
