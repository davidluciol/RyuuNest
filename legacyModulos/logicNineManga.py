import requests
import random
from bs4 import BeautifulSoup
from Utils.EnumHeaders import enumHeaders
from Utils.EnumRutesNineMangas import enumNineMangas
from Modelos.INineMangas import INineMangas

class NineManga:

    headers = enumHeaders.chromeWindowsHeaders.value
    headers["Referer"] = "https://ninemanga.com/"

    def __init__(self):
        pass

    def getRandomHeader(self):
        return random.choice(list(enumHeaders))

    async def getRute(self, route:str = "home") -> list:
        try:
            url = self.getRuter(route)
            soup = await self.getSoup(url)
            if soup:
                return self.getElements(soup)
            else:
                print("Could not parse the webpage.")
                return []
        except Exception as e:
            print(e)
            return []
    
    async def getDetailManga(self, finalLink: str):
        try:
            soup = await self.getSoup(finalLink)
            if soup:
                return self.getDetailBook(soup)
            else:
                print("Could not parse the webpage.")
                return []
        except Exception as e:
            print(e)
            return []

    def getRuter(self, route: str):
        if not route:
            return None
        for item in enumNineMangas:
            if item.name == route:
                return item.value
            pass

    async def getSoup(self, url) -> BeautifulSoup | None:
        try:
            response = requests.get(url, headers= self.headers)
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                return soup
            else:
                print(f"Failed to retrieve the webpage. Status code: {response.status_code}")
                return None
        except Exception as e:
            print(f"An error occurred: {e}")
            return None
    
    def getElements(self, soup:BeautifulSoup) -> list[INineMangas]:
        try:
            ul = soup.find("ul", class_ = "direlist")
            mangas = ul.find_all("dl", class_ = "bookinfo") # type: ignore
            listMangas: list[INineMangas] = []
            for item in mangas:
                a_title = item.find("a", class_ = "bookname")
                thumnail = item.find("img")["src"] # type: ignore
                views = item.find("span").get_text() # type: ignore
                listMangas.append(INineMangas(title = a_title.get_text(), link = a_title["href"], img = thumnail, numViews = views)) # type: ignore
            return listMangas
        except Exception as e:
            print(e)
            return[]
    
    def getDetailBook(self, soup: BeautifulSoup):
        try:
            ulDetail = soup.find("ul", class_ = "message")
            thumnail = soup.find("a", class_ = "bookface").find("img")["src"] # type: ignore
            _title = ulDetail.find("span").get_text() # type: ignore
            description = ulDetail.find("p").get_text() # type: ignore
            links = []
            for i in ulDetail.find_all("a"): # type: ignore
                print(f"\n{i}")
        except Exception as a:
            print(a)