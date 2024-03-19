# example from <https://python.langchain.com/docs/use_cases/question_answering/quickstart>

import bs4

from langchain import hub
from langchain_community.document_loaders import WebBaseLoader
from langchain_community.vectorstores import Chroma
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

from langchain_community.llms.ollama import Ollama
from langchain_community.embeddings import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

debug = True


# init llm for embedding and chat
embedding = OllamaEmbeddings(model="tinyllama:1.1b")
llm = Ollama(model="tinyllama:1.1b")

# load context, parse specific content rather than entire html page
bs4_strainer = bs4.SoupStrainer(class_=("post-title", "post-header", "post-content"))
loader = WebBaseLoader(
    web_paths=(
        "https://lilianweng.github.io/posts/2023-01-10-inference-optimization/",
    ),
    bs_kwargs={"parse_only": bs4_strainer},
)
docs = loader.load()

if debug:
    print("raw context length: ", len(docs[0].page_content))

# split context
text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
splits = text_splitter.split_documents(docs)

if debug:
    print("splits length: ", len(splits))
    print("first split: ", splits[0].page_content)
    print("second split metadata: ", splits[1].metadata)

# load into vectorstore
vectorstore = Chroma.from_documents(documents=splits, embedding=embedding)

# init vector retriever
retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 6})

if debug:
    retrieved_docs = retriever.invoke("What are the approaches to Task Decomposition?")
    print("retrieved_docs length: ", len(retrieved_docs))
    print("first retrieved_doc: ", retrieved_docs[0].page_content)

# create prompt base on hub
prompt = hub.pull("rlm/rag-prompt")

if debug:
    example_messages = prompt.invoke(
        {"context": "filler context", "question": "filler question"}
    ).to_messages()
    print("prompt example: ", example_messages[0].content)


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
