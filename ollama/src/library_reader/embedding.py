# example from <https://python.langchain.com/docs/use_cases/question_answering/quickstart>

import getpass
import os
import bs4

from langchain import hub
from langchain_community.document_loaders import WebBaseLoader
from langchain_community.vectorstores import Chroma
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

from langchain_community.llms.ollama import Ollama
from langchain_community.embeddings import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

debug = False

# enable langsmith
os.environ["LANGCHAIN_TRACING_V2"] = debug

# init llm for embedding and chat
embedding = OllamaEmbeddings(model="nomic-embed-text")
llm = Ollama(model="mistral")

# load context, parse specific content rather than entire html page
bs4_strainer = bs4.SoupStrainer(class_=("post-title", "post-header", "post-content"))
loader = WebBaseLoader(
    web_paths=(
        "https://lilianweng.github.io/posts/2023-06-23-agent/",
    ),
    bs_kwargs={"parse_only": bs4_strainer},
)
docs = loader.load()

if debug:
    print("\nDEBUG:\traw context length: ", len(docs[0].page_content))

# split context
text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
splits = text_splitter.split_documents(docs)

if debug:
    print("DEBUG:\n\tsplits length: ", len(splits))
    print("DEBUG:\n\tfirst split: ", splits[0].page_content)
    print("DEBUG:\n\tsecond split metadata: ", splits[1].metadata)

# load into vectorstore
vectorstore = Chroma.from_documents(documents=splits, embedding=embedding)

# init vector retriever
retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 6})

if debug:
    retrieved_docs = retriever.invoke("What are the approaches to Task Decomposition?")
    print("DEBUG:\n\tretrieved_docs length: ", len(retrieved_docs))
    print("DEBUG:\n\tfirst retrieved_doc: ", retrieved_docs[0].page_content)

# create prompt base on hub
prompt = hub.pull("rlm/rag-prompt")

if debug:
    example_messages = prompt.invoke(
        {"context": "filler context", "question": "filler question"}
    ).to_messages()
    print("DEBUG:\n\tprompt example: ", example_messages[0].content)


def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)


# invoke chain
rag_chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)

# rag_chain.invoke("What is Task Decomposition?")
for chunk in rag_chain.stream("What is Task Decomposition?"):
    print(chunk, end="", flush=True)

# cleanup
# vectorstore.delete_collection()
