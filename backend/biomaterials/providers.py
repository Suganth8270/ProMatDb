from abc import ABC, abstractmethod


class BiomaterialProvider(ABC):

    @abstractmethod
    def search(self, name: str):
        pass