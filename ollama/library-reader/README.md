# library-reader

A simple app to showcase how to create a RAG application with opensource toolchains, and running locally.

## architecture

There are 2 phases for RAG application generally ...

- Build the memory - documents to embeddings
- Query with context - combine memory, history, prompt as input question

In this POC, we only handle static documents (no runtime add/update).

To build/deploy it easily, we separate it to components:

- Document Loader: download files from s3/git to filesystem
> in production, you can extend this to fetch data from more datasources, periodically.
- Embedding: parse and convert documents to vectors
> in production, you can update the embeddings periodically.
- Vector storage: store/query the vectors
- Chatbot: orchestrate question/answer and context
- Server: expose chatbot as api
- UI: end user interface

## Reference

- [【官方教程】ChatGLM + LangChain 实践培训](https://www.bilibili.com/video/BV13M4y1e7cN/?share_source=copy_web&vd_source=e6c5aafe684f30fbe41925d61ca6d514)
