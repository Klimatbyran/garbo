## Klimatkollen Garbo AI

This is the main repo for the AI bot we call Garbo. Garbo is a Discord bot that is powered by LLM:s to effectively fetch and extract GHG self reported data from companies.

Garbo is invoked through a set of commands in Discord and has a pipeline of tasks that will be started in order for her to both extract, evaluate and format the data autonomously.

We utilise an open source queue manager called BullMQ which relies on Redis. The data is then stored into Elasticsearch and Wikidata.

![image](https://github.com/Klimatbyran/garbo/assets/395843/f3b4caa2-aa7d-4269-9436-3e725311052e)

## Current Status

Test the app in Discord channel #rapporter-att-granska by using the command /pdf <url> and Garbo will be answering with a parsed JSON

## Data Flow

Some of the following steps will be performed in parallel and most will be asynchronous. If a process is failed it's important to be able to restart it after a new code release so we can iterate on the prompts etc without having to restart the whole process again.

1. Import PDF from URL
2. Parse Text
3. Send text to OpenAI for embeddings
4. Index vector database with embeddings
5. Build query from prompt together with relevant embeddings
6. Send to LLM
7. Verify the results first automatically
8. Verify results in Discord channel
9. Save to Wikidata or other database (not done)

### Get Started

Get an OPENAI_API_KEY from OpenAI and add it to a .env file in the root directory. Run redis locally or add REDIS_HOST and REDIS_PORT into the .env file.

    npm i
    docker run -d -p 6379:6379 redis
    docker run -d -p 8000:8000 chromadb/chroma
    docker run -d -p 3333:3000 gotenberg/gotenberg
    npm run dev

NOTE: To add a new job to the queue manually you can uncomment the lines in index.ts to create a new downloadPDF job.

### Environment/Secrets

Create a .env file in the root lib and add these tokens/secrets before running the application:

    OPENAI_API_KEY=
    OPENAI_ORG_ID=
    DISCORD_APPLICATION_ID=
    DISCORD_TOKEN=
    DISCORD_SERVER_ID=
    ELASTIC_NODE_URL=
    ELASTIC_INDEX_NAME=

### Next steps / Tasks

#### First Milestone

- [x] Test on smaller PDF files
- [x] Split PDF text into smaller chunks (maybe using langchain pdf instead of custom?)
- [x] Add chunks to vector database (ChromaDB)
- [x] Use vector database with langchain when doing queries to limit amount of tokens
- [x] DevOps/Kubernetes setup for databases and deployment (see [https://github.com/Klimatbyran/infra](infra) repo - private)
- [ ] Tests etc

### Operations

This application is run in Kubernetes and uses FluxCD as CD pipeline. To create secret in the k8s cluster - use this command to transfer your .env file as secret to the application

    kubectl create secret generic env --from-env-file=.env

### License

MIT
