## Klimatkollen Data Pipeline

This is the main repo for fetching data from sources and adding them to our database. 

## Current Status

First working prototype. 

### Get Started
Get an OPENAI_API_KEY from OpenAI and add it to a .env file in the root directory

    npm i
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
