# ollama

## How to start

similar like docker

- pull, run ...

## Advanced

### http server

`ollama serve` at `http://localhost:11434`

### [Building LLM-Powered Web Apps with Client-Side Technology](https://ollama.com/blog/building-llm-powered-web-apps)

> The general idea here is to take the user’s input question, search our prepared vectorstore for document chunks most semantically similar to the query, and use the retrieved chunks plus the original question to guide the LLM to a final answer based on our input data.
>
> There’s an additional step required for followup questions, which may contain pronouns or other references to prior chat history. Because vectorstores perform retrieval by semantic similarity, these references can throw off retrieval. Therefore, we add an additional dereferencing step that rephrases the initial step into a “standalone” question before using that question to search our vectorstore.

![alt text](docs/llm-query.png)

## [Sample](https://github.com/Anddd7/library-reader)
