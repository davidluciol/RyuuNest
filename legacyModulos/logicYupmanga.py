import random
import requests
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError
from Utils.EnumHeaders import enumHeaders
from Utils.EnumYupmangas import directoryRoutes
from Modelos.IYupmangas import miniData
class logicYupmanga:

    headers = enumHeaders.chromeWindowsHeaders.value
    headers["Referer"] = "https://www.yupmanga.com/"
    BASE_URL = "https://www.yupmanga.com/"
    def __init__(self):
        pass

    def getRandomHeader(self):
        return random.choice(list(enumHeaders))

    def getRuter(self, route: str):
        if not route:
            return ""
        for item in directoryRoutes:
            if item.name == route:
                return item.value
            pass

    async def getSoup(self, url) -> BeautifulSoup | None:
        try:
            response = requests.get(url, headers = self.headers, allow_redirects = True)
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                return soup
            else:
                print(f"Failed to retrieve the webpage. Status code: {response.status_code}")
                return None
        except Exception as e:
            print(f"An error occurred: {e}")
            return None

    async def getPageElements(self, _url) -> list:
        #TODO: La Solución: Impersonar el navegador a nivel TCP/TLS Necesitas librerías que puedan 
        # simular el handshake de un navegador real. En los foros, 
        # la recomendación número uno actual es dejar requests y usar curl_cffi o tls_client.
        try:
            link = self.getRuter(route = _url)
            print(link)
            soup = await self.getSoup(link)
            if not soup:
                return []
            
            return self.getElements(soup)
        except Exception as e:
            print(e)
            return []
        
    def getElements(self, soup: BeautifulSoup) :
        try:
            cards = soup.find_all("div", class_ = ["comic-card", "group"])
            elements: list[miniData] = []
            for card in cards:
                _link: str = card.find("a", class_ = ["block", "relative"])["href"]
                countCap: str = card.find("span", class_= "leading-none").get_text()
                thumnail: str = card.find("img", class_ = "w-full")["src"]
                _title: str = card.find("h3", class_ = "text-center").get_text()
                elements.append(miniData(title = _title, totalCaps = countCap, img = thumnail, link = _link))
            return elements
        except Exception as e:
            print(e)
            return []