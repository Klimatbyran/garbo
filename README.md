## Klimatkollen Data Pipeline

This is the main repo for fetching data from sources and adding them to our database in a multi-step process using BullMQ as task handler. 

<img width="1200" alt="image" src="https://github.com/Klimatbyran/data-pipeline/assets/395843/d280fbc0-6fd9-496e-a487-9b37c3ab179f">


## Current Status

First working prototype for pipeline but doesn't work on large PDF files yet.

### Get Started
Get an OPENAI_API_KEY from OpenAI and add it to a .env file in the root directory. Run redis locally or add REDIS_HOST and REDIS_PORT into the .env file.

    npm i
    docker run -d -p 6379:6379 redis
    npm run dev

### Next steps / Tasks

#### First Milestone
- [ ] Test on smaller PDF files
- [ ] Split PDF text into smaller chunks (maybe using langchain pdf instead of custom?)
- [ ] Add chunks to vector database
- [ ] Use vector database with langchain when doing queries to limit amount of tokens
- [ ] Docker-compose file for dependencies
- [ ] DevOps/Kubernetes setup for databases and deployment
- [ ] Tests etc

### License

MIT
