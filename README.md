## Klimatkollen Garbo AI

This is the main repo for the AI bot we call Garbo. Garbo is a Discord bot that is powered by LLM:s to effectively fetch and extract GHG self reported data from companies.

Garbo is invoked through a set of commands in Discord and has a pipeline of tasks that will be started in order for her to both extract, evaluate and format the data autonomously.

We utilise an open source queue manager called BullMQ which relies on Redis. The data is then stored into OpenSearch and Wikidata.

![image](https://github.com/Klimatbyran/garbo/assets/395843/f3b4caa2-aa7d-4269-9436-3e725311052e)

## Current Status

Test the app in Discord channel #rapporter-att-granska by using the command /pdf <url> and Garbo will be answering with a parsed JSON

## Data Flow

Some of the following steps will be performed in parallel and most will be asynchronous. If a process is failed it's important to be able to restart it after a new code release so we can iterate on the prompts etc without having to restart the whole process again.

```mermaid
flowchart TB

    A[PDF]
    B{Is in cache?}
    C[Download PDF]
    D[Index Database]
    E[Search Database]
    F[Extract Emissions]
    G[JSON]

    Industry[Extract Industry]
    Goals[Extract Climate Goals]
    Review[Reasonability Assessment]


    DB[OpenSearch/Kibana]

    A --> B --> C --> D --> E ---> F ---> G ---> H
    B --(Cached)--> E

    F --> CompanyName --(.company)--> G
    F --> Industry --(.industry)--> G
    F --> Scope1+2 --(.scope1)--> G
    F --> Scope3 --(.scope3)--> G
    F --> Goals --(.goals)--> G
    F --> Initiatives --(.initiatives)--> G
    F --> Contacts --(.contacts)--> G
    F --> Turnover --(.turnover)--> G
    F --> Factors --(.factors)--> G

    G --> Format --(json)--> H

    H --> Review --> DB
    H --> Review --> DB
```

### Get Started

Get an OPENAI_API_KEY from OpenAI and add it to a .env file in the root directory. Run redis locally or add REDIS_HOST and REDIS_PORT into the .env file.

NOTE! First [install bun](https://bun.sh/docs/installation#installing) (a more decent version of javascript runtime with typescript included)

```bash
bun i
docker run -d -p 6379:6379 redis
docker run -d -p 8000:8000 chromadb/chroma
docker run -d -p 9200:9200 opensearch # TODO: add instructions for running opensearch locally
bun start & bun run workers
```

## How to run the code

The code consists of two different starting points. The first one will serve the BullMQ queue UI and will also be responsible for listening to new events from Discord.

```bash
bun start
```

Now you can go to http://localhost:3000 and see the dashboard.

The second one is the workers responsible for doing the actual work. This part can be scaled horisontally and divide the work automatically through the queue.

```bash
bun run workers
```

### Environment/Secrets

Create a .env file in the root lib and add these tokens/secrets before running the application:

```bash
OPENAI_API_KEY=
OPENAI_ORG_ID=
DISCORD_APPLICATION_ID=
DISCORD_TOKEN=
DISCORD_SERVER_ID=

# these are optional, the code works fine without Llama cloud and OpenSearch:
LLAMA_CLOUD_API_KEY=
OPENSEARCH_NODE_URL=
OPENSEARCH_INDEX_NAME=
```

## How to run with nodemon

Either you run both workers and board in the same terminal with same command through `concurrently`

```bash
bun run dev
```

or you start them separately

```bash
bun run dev-workers
# new terminal:
bun run dev-board
```

### How to run with Docker

```bash
docker run -d -p 3000:3000 ghcr.io/klimatbyran/garbo bun start

# start how many workers you want:
docker run -d ghcr.io/klimatbyran/garbo bun run workers
docker run -d ghcr.io/klimatbyran/garbo bun run workers
docker run -d ghcr.io/klimatbyran/garbo bun run workers
```

### Next steps / Tasks

### Operations

This application is run in Kubernetes and uses FluxCD as CD pipeline. To create secret in the k8s cluster - use this command to transfer your .env file as secret to the application

```bash
kubectl create secret generic env --from-env-file=.env
```

### License

MIT
