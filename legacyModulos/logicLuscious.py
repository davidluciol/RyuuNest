import requests
import random
from bs4 import BeautifulSoup
from Utils.EnumHeaders import enumHeaders
from Utils.EnumRutesLuscious import enumRoutesLuscious
from Modelos.ILuscious import baseList
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError

class Luscious:
    headers = enumHeaders.chromeWindowsHeaders.value
    headers["Referer"] = "https://www.luscious.net/"

    def __init__(self):
        pass

    def getRandomHeader(self):
        return random.choice(list(enumHeaders))
    
    def getRuter(self, route: str):
        if not route:
            return None
        for item in enumRoutesLuscious:
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
        
    async def getElementsRoutes(self, route) -> list:
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
    
    async def getDetailBook(self, _url:str):
        try:
            soup = await self.getSoupPlaywright(_url)
            if not soup:
                return []
            
            _title = soup.find("h1", class_ = ["o-h1", "album-heading"])
        except Exception as e:
            print(e)
        
    def getElements(self, soup:BeautifulSoup):
        try:
            box = soup.find_all("div", class_ = "o-justified-box")
            data: list[baseList] = []
            for item in box:
                a_item = item.find("a")
                _title = a_item.find("h2", class_ = "album-card-title").get_text() # type: ignore
                numPictures = a_item.find("div", class_ = "album-card-number").get_text() # type: ignore
                _link = a_item["href"] # type: ignore
                _link = f"https://www.luscious.net{_link}"
                _img: str = a_item.find("img", class_ ="o-fitted-media")["src"] # type: ignore
                lang: str = "no-words" if not item.find("svg")["aria-label"] else item.find("svg")["aria-label"] # type: ignore
                #_status = a_item.find("div", class_ = "card-label").get_text() # type: ignore
                data.append(baseList(title = _title, img = _img, link = _link, lang = "es", status = "_status"))
            return data
        except Exception as e:
            print(e)
            return[]
        
    async def getSoupPlaywright(self, _url:str):
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch()
                page = await browser.new_page()
                await page.goto(_url, wait_until="load")
                lastAlbum = page.locator("h2.o-h2.album-grid-header")
                await lastAlbum.focus()
                html = await page.content()
                soup = BeautifulSoup(html, 'html.parser')
                await browser.close()
            return soup
        except Exception as b:
            print(b)
            return None