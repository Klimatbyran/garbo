## Klimatkollen Data Pipeline

This is the main repo for fetching data from sources and adding them to our database in a multi-step process using BullMQ as task handler.

<img width="1200" alt="image" src="https://github.com/Klimatbyran/data-pipeline/assets/395843/d280fbc0-6fd9-496e-a487-9b37c3ab179f">

## Current Status

First working prototype for pipeline but doesn't work on large PDF files yet.

## Data Flow

Some of the following steps will be performed in parallel and most will be asynchronous. If a process is failed it's important to be able to restart it after a new code release so we can iterate on the prompts etc without having to restart the whole process again.

1. Import PDF from URL
2. Parse Text
3. Send text to OpenAI for embeddings (not done)
4. Index vector database with embeddings (not done)
5. Build query from prompt together with relevant embeddings
6. Send to LLM
7. Verify the results first automatically (not done)
8. Verify results in Discord channel (not done)
9. Save to Wikidata or other database (not done)

### Get Started

Get an OPENAI_API_KEY from OpenAI and add it to a .env file in the root directory. Run redis locally or add REDIS_HOST and REDIS_PORT into the .env file.

    npm i
    docker run -d -p 6379:6379 redis
    docker run -d -p 8000:8000 chromadb
    npm run dev

### Next steps / Tasks

#### First Milestone

- [ ] Test on smaller PDF files
- [ ] Split PDF text into smaller chunks (maybe using langchain pdf instead of custom?)
- [ ] Add chunks to vector database (ChromaDB)
- [ ] Use vector database with langchain when doing queries to limit amount of tokens
- [ ] Docker-compose file for dependencies
- [ ] DevOps/Kubernetes setup for databases and deployment
- [ ] Tests etc

### License

MIT
