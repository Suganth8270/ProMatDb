from abc import ABC, abstractmethod


class BiomaterialProvider(ABC):

    @abstractmethod
    def search(self, query: str):
        """Search biomaterials from the source."""
        pass

    @abstractmethod
    def get_details(self, identifier: str):
        """Fetch complete biomaterial details."""
        pass

    @abstractmethod
    def source_name(self):
        """Return provider name."""
        pass