// ! Commented out until we have decided to remove nlm completely
// import { DiscordWorker } from '../lib/DiscordWorker'
// import { FlowProducer } from 'bullmq'
// import { extractJsonFromPdf, fetchPdf } from '../lib/pdfTools'
// import redis from '../config/redis'
// import precheck from './precheck'
// import { jsonToMarkdown } from '../lib/jsonExtraction'
// import { vectorDB } from '../lib/vectordb'
// import { ParsedDocument } from '../lib/nlm-ingestor-schema'
// import { QUEUE_NAMES } from '../queues'

// const headers = {
//   'User-Agent':
//     'Mozilla/5.0 (Linux; Android 10; SM-G996U Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Mobile Safari/537.36', //Garbo/1.0 (Linux; OpenAI 4;) Klimatkollen',
// }

// const flow = new FlowProducer({ connection: redis })

// const nlmParsePDF = new DiscordWorker(
//   QUEUE_NAMES.NLM_PARSE_PDF,
//   async (job) => {
//     const { url } = job.data
//     job.opts.attempts = 1

//     const name = url.slice(-20)
//     const base = {
//       data: {
//         ...job.data,
//       },
//     }

//     job.log(`Downloading from url: ${url}`)

//     try {
//       const pdf = await fetchPdf(url, { headers })

//       job.editMessage(
//         `✅ PDF downloaded. Reading PDF via nlm-ingestor. This may take up to 3 minutes. ☕️ ...`,
//       )

//       const exists = await vectorDB.hasReport(url)

//       if (!exists) {
//         const before = Date.now()
//         const interval = setInterval(async () => {
//           const elapsed = Date.now() - before
//           const remaining = Math.max(0, 180 - Math.floor(elapsed / 1000))
//           if (remaining > 0) {
//             await job.editMessage(
//               `✅ PDF downloaded. Reading PDF via nlm-ingestor. Approximately ${remaining}s left ☕️ ...`,
//             )
//             await job.sendTyping()
//           } else {
//             await job.editMessage('Now it should be done...... 🤔')
//           }
//         }, 10000)

//         let json: ParsedDocument

//         try {
//           json = await extractJsonFromPdf(pdf)
//         } catch (err) {
//           job.log(
//             'Failed to parse PDF: ' +
//               err.message +
//               ', switching parser to docling...',
//           )
//           job.editMessage(
//             `❌ Failed to parse PDF: ${err.message}. switching parser to docling..`,
//           )

//           const precheck = await flow.add({
//             ...base,
//             name: 'precheck ' + name,
//             queueName: QUEUE_NAMES.PRECHECK,
//             children: [
//               {
//                 ...base,
//                 name: 'indexMarkdown ' + name,
//                 queueName: QUEUE_NAMES.INDEX_MARKDOWN,
//                 children: [
//                   {
//                     ...base,
//                     name: 'doclingParsePDF ' + name,
//                     queueName: QUEUE_NAMES.DOCLING_PARSE_PDF,
//                   },
//                 ],
//               },
//             ],
//           })
//           job.log('flow started: ' + precheck.job?.id)
//           throw new Error('Failed to parse PDF, switching parser to docling...')
//         } finally {
//           clearInterval(interval)
//         }

//         const markdown = jsonToMarkdown(json)

//         if (!json.return_dict.result.blocks.length || !markdown.trim()) {
//           await job.editMessage(
//             '❌ Error parsing PDF: No content, trying with another parser...',
//           )

//           const precheck = await flow.add({
//             ...base,
//             name: 'precheck ' + name,
//             queueName: QUEUE_NAMES.PRECHECK,
//             children: [
//               {
//                 ...base,
//                 name: 'indexMarkdown ' + name,
//                 queueName: QUEUE_NAMES.INDEX_MARKDOWN,
//                 children: [
//                   {
//                     ...base,
//                     name: 'doclingParsePDF ' + name,
//                     queueName: QUEUE_NAMES.DOCLING_PARSE_PDF,
//                   },
//                 ],
//               },
//             ],
//           })
//           job.log('flow started: ' + precheck.job?.id)

//           throw new Error('Failed to parse PDF, switching parser to docling...')
//         }

//         job.log('text found:\n' + markdown)
//         job.updateData({
//           ...job.data,
//           json,
//         })

//         await job.editMessage(`✅ PDF interpreted`)

//         await job.editMessage(`🤖 Interpreting tables...`)

//         const precheck = await flow.add({
//           ...base,
//           name: 'precheck ' + name,
//           queueName: QUEUE_NAMES.PRECHECK,
//           children: [
//             {
//               ...base,
//               name: 'indexMarkdown ' + name,
//               data: {
//                 ...base.data,
//                 markdown,
//               },
//               queueName: QUEUE_NAMES.INDEX_MARKDOWN,
//               children: [
//                 {
//                   ...base,
//                   data: {
//                     ...base.data,
//                     // Pass json explicitly where we need it
//                     json,
//                   },
//                   name: 'extractTables ' + name,
//                   queueName: QUEUE_NAMES.NLM_EXTRACT_TABLES,
//                 },
//               ],
//             },
//           ],
//         })
//         job.log('flow started: ' + precheck.job?.id)
//       } else {
//         job.editMessage(`✅ PDF already interpreted and indexed. Continuing...`)

//         const markdown = await vectorDB.getRelevantMarkdown(url, [
//           'GHG accounting, tCO2e (location-based method), ton CO2e, scope, scope 1, scope 2, scope 3, co2, emissions, emissions, 2021, 2023, 2022, gri protocol, CO2, ghg, greenhouse, gas, climate, change, global, warming, carbon, växthusgaser, utsläpp, basår, koldioxidutsläpp, koldioxid, klimatmål',
//         ])

//         const added = await precheck.queue.add('precheck', {
//           ...job.data,
//           cachedMarkdown: markdown,
//         })
//         return added.id
//       }
//       return true
//     } catch (error) {
//       job.editMessage(`❌ Error downloading PDF: ${error.message}`)
//       throw new Error(error)
//     }
//   },
//   { concurrency: 1, connection: redis, lockDuration: 5 * 60 * 1000 },
// )

// export default nlmParsePDF
