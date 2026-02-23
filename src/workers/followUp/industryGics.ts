import { QUEUE_NAMES } from '../../queues'
import { FollowUpJob, FollowUpWorker } from '../../lib/FollowUpWorker'
import { z } from 'zod'
import { FollowUpType } from '../../types'

export const schema = z.object({
  industry: z.object({
    subIndustryCode: z.string(),
  }),
})

export const prompt = `
Extract industry, sector, industry group, according to GICS:

## Sektor: Energi (10)

### Energi (1010)
  * Energiutrustning och tjänster (101010)
    - Olje- och gasborrning (10101010)
    - Olje- och gasutrustning och tjänster (10101020)
  * Olja, gas och förbrukningsbara bränslen (101020)
    - Integrerade olje- och gasföretag (10102010)
    - Olje- och gasprospektering och produktion (10102020)
    - Olje- och gasraffinering och marknadsföring (10102030)
    - Olje- och gaslagring och transport (10102040)
    - Kol och förbrukningsbara bränslen (10102050)

## Sektor: Material (15)

### Material (1510)
  * Kemikalier (151010)
    - Råvarukemikalier (15101010)
    - Diversifierade kemikalier (15101020)
    - Gödselmedel och jordbrukskemikalier (15101030)
    - Industrigaser (15101040)
    - Specialkemikalier (15101050)
  * Byggmaterial (151020)
    - Byggmaterial (15102010)
  * Behållare och förpackningar (151030)
    - Metall-, glas- och plastbehållare (15103010)
    - Papper- och plastförpackningar (15103020)
  * Metaller och gruvdrift (151040)
    - Aluminium (15104010)
    - Diversifierade metaller och gruvdrift (15104020)
    - Koppar (15104025)
    - Guld (15104030)
    - Ädelmetaller och mineraler (15104040)
    - Silver (15104045)
    - Stål (15104050)
  * Pappers- och skogsprodukter (151050)
    - Skogsprodukter (15105010)
    - Pappersprodukter (15105020)

## Sektor: Industrivaror och tjänster (20)

### Kapitalvaror (2010)
  * Flyg och försvar (201010)
    - Flyg och försvar (20101010)
  * Byggprodukter (201020)
    - Byggprodukter (20102010)
  * Bygg och anläggning (201030)
    - Bygg och anläggning (20103010)
  * Elektrisk utrustning (201040)
    - Elektriska komponenter och utrustning (20104010)
    - Tung elektrisk utrustning (20104020)
  * Industriella konglomerat (201050)
    - Industriella konglomerat (20105010)
  * Maskiner (201060)
    - Byggmaskiner och tung transportutrustning (20106010)
    - Jordbruks- och lantbruksmaskiner (20106015)
    - Industriella maskiner och tillbehör (20106020)
  * Handelsföretag och distributörer (201070)
    - Handelsföretag och distributörer (20107010)

### Kommersiella och professionella tjänster (2020)
  * Kommersiella tjänster och leveranser (202010)
    - Kommersiell tryckning (20201010)
    - Miljö- och facilitetsservice (20201050)
    - Kontorsservice och leveranser (20201060)
    - Diversifierade stödtjänster (20201070)
    - Säkerhets- och larmsystem (20201080)
  * Professionella tjänster (202020)
    - Personal- och rekryteringstjänster (20202010)
    - Forsknings- och konsulttjänster (20202020)
    - Databehandling och outsourcade tjänster (20202030)

### Transport (2030)
  * Flygfrakt och logistik (203010)
    - Flygfrakt och logistik (20301010)
  * Passagerarflygbolag (203020)
    - Passagerarflygbolag (20302010)
  * Marin transport (203030)
    - Marin transport (20303010)
  * Landtransport (203040)
    - Järnvägstransport (20304010)
    - Godstransport på marken (20304030)
    - Persontransport på marken (20304040)
  * Transportinfrastruktur (203050)
    - Flygplatstjänster (20305010)
    - Motorvägar och järnvägar (20305020)
    - Hamnar och tjänster (20305030)

## Sektor: Sällanköpsvaror och tjänster (25)

### Bilar och komponenter (2510)
  * Bilkomponenter (251010)
    - Bildelar och utrustning (25101010)
    - Däck och gummi (25101020)
  * Bilar (251020)
    - Biltillverkare (25102010)
    - Motorcykeltillverkare (25102020)

### Konsumentvaror (2520)
  * Hushållsvaror (252010)
    - Konsumentelektronik (25201010)
    - Heminredning (25201020)
    - Hembyggnad (25201030)
    - Hushållsapparater (25201040)
    - Husgeråd och specialiteter (25201050)
  * Fritidsprodukter (252020)
    - Fritidsprodukter (25202010)
  * Textilier, kläder och lyxvaror (252030)
    - Kläder, accessoarer och lyxvaror (25203010)
    - Fotbeklädnad (25203020)
    - Textilier (25203030)

### Konsumenttjänster (2530)
  * Hotell, restauranger och fritid (253010)
    - Kasinon och spel (25301010)
    - Hotell, resorter och kryssningslinjer (25301020)
    - Fritidsanläggningar (25301030)
    - Restauranger (25301040)
  * Diversifierade konsumenttjänster (253020)
    - Utbildningstjänster (25302010)
    - Specialiserade konsumenttjänster (25302020)

### Distribution och detaljhandel (2550)
  * Distributörer (255010)
    - Distributörer (25501010)
  * Bred detaljhandel (255030)
    - Bred detaljhandel (25503030)
  * Specialiserad detaljhandel (255040)
    - Kläddetaljhandel (25504010)
    - Dator- och elektronikdetaljhandel (25504020)
    - Hemförbättringsdetaljhandel (25504030)
    - Annan specialiserad detaljhandel (25504040)
    - Fordonsdetaljhandel (25504050)
    - Heminredningsdetaljhandel (25504060)

## Sektor: Dagligvaror (30)

### Distribution och detaljhandel för dagligvaror (3010)
  * Distribution och detaljhandel för dagligvaror (301010)
    - Apoteksdetaljhandel (30101010)
    - Livsmedelsdistributörer (30101020)
    - Livsmedelsdetaljhandel (30101030)
    - Detaljhandel för dagligvaror (30101040)

### Livsmedel, drycker och tobak (3020)
  * Drycker (302010)
    - Bryggerier (30201010)
    - Destillerier och vinproducenter (30201020)
    - Läskedrycker och icke-alkoholhaltiga drycker (30201030)
  * Livsmedelsprodukter (302020)
    - Jordbruksprodukter och tjänster (30202010)
    - Förpackade livsmedel och kött (30202030)
  * Tobak (302030)
    - Tobak (30203010)

### Hushålls- och personprodukter (3030)
  * Hushållsprodukter (303010)
    - Hushållsprodukter (30301010)
  * Personvårdsprodukter (303020)
    - Personvårdsprodukter (30302010)

## Sektor: Hälsovård (35)

### Hälsovårdsutrustning och tjänster (3510)
  * Hälsovårdsutrustning och -tillbehör (351010)
    - Hälsovårdsutrustning (35101010)
    - Hälsovårdstillbehör (35101020)
  * Hälsovårdstjänster och -leverantörer (351020)
    - Hälsovårdsdistributörer (35102010)
    - Hälsovårdstjänster (35102015)
    - Hälsovårdsanläggningar (35102020)
    - Förvaltad hälsovård (35102030)
  * Hälsoteknologi (351030)
    - Hälsoteknologi (35103010)

### Läkemedel, bioteknik och liv

svetenskaper (3520)
  * Bioteknik (352010)
    - Bioteknik (35201010)
  * Läkemedel (352020)
    - Läkemedel (35202010)
  * Livsvetenskapliga verktyg och tjänster (352030)
    - Livsvetenskapliga verktyg och tjänster (35203010)

## Sektor: Finans och fastighet (40)

### Banker (4010)
  * Banker (401010)
    - Diversifierade banker (40101010)
    - Regionala banker (40101015)

### Finansiella tjänster (4020)
  * Finansiella tjänster (402010)
    - Diversifierade finansiella tjänster (40201020)
    - Flersektor innehav (40201030)
    - Specialiserad finansiering (40201040)
    - Kommersiell och bostadsmortgagelån (40201050)
    - Transaktions- och betalningstjänster (40201060)
  * Konsumentfinansiering (402020)
    - Konsumentfinansiering (40202010)
  * Kapitalmarknader (402030)
    - Tillgångsförvaltning och förvaringsbanker (40203010)
    - Investeringsbanker och mäklare (40203020)
    - Diversifierade kapitalmarknader (40203030)
    - Finansiella börser och data (40203040)
  * Fastighetsinvestmentbolag (REITs) (402040)
    - Fastighets-REITs (40204010)

### Försäkring (4030)
  * Försäkring (403010)
    - Försäkringsmäklare (40301010)
    - Liv- och sjukförsäkring (40301020)
    - Multiförsäkring (40301030)
    - Egendoms- och skadeförsäkring (40301040)
    - Återförsäkring (40301050)

## Sektor: Informationsteknik (45)

### Programvara och tjänster (4510)
  * IT-tjänster (451020)
    - IT-konsulttjänster och andra tjänster (45102010)
    - Internettjänster och infrastruktur (45102030)
  * Programvara (451030)
    - Applikationsprogramvara (45103010)
    - Systemprogramvara (45103020)

### Teknikhårdvara och utrustning (4520)
  * Kommunikationsutrustning (452010)
    - Kommunikationsutrustning (45201020)
  * Teknikhårdvara, lagring och kringutrustning (452020)
    - Teknikhårdvara, lagring och kringutrustning (45202030)
  * Elektronisk utrustning, instrument och komponenter (452030)
    - Elektronisk utrustning och instrument (45203010)
    - Elektroniska komponenter (45203015)
    - Elektroniska tillverkningstjänster (45203020)
    - Teknikdistributörer (45203030)

### Halvledare och halvledarutrustning (4530)
  * Halvledare och halvledarutrustning (453010)
    - Halvledarmaterial och utrustning (45301010)
    - Halvledare (45301020)

## Sektor: Teleoperatörer (50)

### Telekommunikationstjänster (5010)
  * Diversifierade telekommunikationstjänster (501010)
    - Alternativa operatörer (50101010)
    - Integrerade telekommunikationstjänster (50101020)
  * Trådlösa telekommunikationstjänster (501020)
    - Trådlösa telekommunikationstjänster (50102010)

### Media och underhållning (5020)
  * Media (502010)
    - Reklam (50201010)
    - Sändningar (50201020)
    - Kabel- och satellit (50201030)
    - Förlag (50201040)
  * Underhållning (502020)
    - Filmer och underhållning (50202010)
    - Interaktiv hemmaunderhållning (50202020)
  * Interaktiv media och tjänster (502030)
    - Interaktiv media och tjänster (50203010)

## Sektor: Kraftförsörjning (55)

### Kraftförsörjning (5510)
  * Elektricitetsförsörjning (551010)
    - Elektricitetsförsörjning (55101010)
  * Gasförsörjning (551020)
    - Gasförsörjning (55102010)
  * Flersektors kraftförsörjning (551030)
    - Flersektors kraftförsörjning (55103010)
  * Vattenförsörjning (551040)
    - Vattenförsörjning (55104010)
  * Oberoende kraftproducenter och förnybar elektricitet (551050)
    - Oberoende kraftproducenter och energihandlare (55105010)
    - Förnybar elektricitet (55105020)

## Sektor: Finans och fastighet (60)

### Fastighetsinvesteringsbolag (REITs) (6010)
  * Diversifierade REITs (601010)
    - Diversifierade REITs (60101010)
  * Industriella REITs (601025)
    - Industriella REITs (60102510)
  * Hotell- och resort-REITs (601030)
    - Hotell- och resort-REITs (60103010)
  * Kontors-REITs (601040)
    - Kontors-REITs (60104010)
  * Hälsovårds-REITs (601050)
    - Hälsovårds-REITs (60105010)
  * Bostads-REITs (601060)
    - Flerfamiljs-REITs (60106010)
    - Enfamiljs-REITs (60106020)
  * Detaljhandels-REITs (601070)
    - Detaljhandels-REITs (60107010)
  * Specialiserade REITs (601080)
    - Andra specialiserade REITs (60108010)
    - Självlagrings-REITs (60108020)
    - Telekommunikationstorn-REITs (60108030)
    - Skogs-REITs (60108040)
    - Datacenter-REITs (60108050)

### Fastighetsförvaltning och -utveckling (6020)
  * Fastighetsförvaltning och -utveckling (602010)
    - Diversifierade fastighetsaktiviteter (60201010)
    - Fastighetsoperativa företag (60201020)
    - Fastighetsutveckling (60201030)
    - Fastighetstjänster (60201040)

Just reply with the information in JSON format. In Swedish, please. NEVER USE EXAMPLE DATA. Do not use markdown in the output.

Example:
\`\`\`json
{
  "industry": {
    "subIndustryCode": "12345678"
  }
}
\`\`\`
`

const queryTexts = [
  'GICS industry codes',
  'Sector and sub-industry',
  'Sub-industry classification',
]

const industryGics = new FollowUpWorker<FollowUpJob>(
  QUEUE_NAMES.FOLLOW_UP_INDUSTRY_GICS,
  async (job) => {
    const { url, previousAnswer } = job.data
    const answer = await job.followUp(
      url,
      previousAnswer,
      schema,
      prompt,
      queryTexts,
      FollowUpType.IndustryGics,
    )
    return answer
  },
)

export default industryGics
