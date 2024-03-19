# example from <https://python.langchain.com/docs/guides/local_llms>

from langchain_community.llms import Ollama

from langchain.callbacks.manager import CallbackManager
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler

llm = Ollama(
    model="tinyllama:1.1b",
    callback_manager=CallbackManager([StreamingStdOutCallbackHandler()]),
)
llm.invoke("The first man on the moon was ...")
