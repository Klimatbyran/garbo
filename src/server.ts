import startApp from './app'
import apiConfig from './config/api'
import openAPIConfig from './config/openapi'

const app = await startApp()

async function main() {
  try {
    await app.ready()
    await app.listen({
      port: apiConfig.port,
    })

    app.log.info(
      `OpenAPI docs served at http://localhost:${apiConfig.port}/${openAPIConfig.openAPIPrefix}`
    )
  } catch (e) {
    app.log.error(e)
    process.exit(1)
  }
}

await main()
