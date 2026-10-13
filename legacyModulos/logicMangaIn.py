import re
import requests
import random
import json
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError
from Utils.EnumHeaders import enumHeaders
from Utils.EnumRutesMangasIn import EnumRutesMangasIn, EnumType
from Modelos.IMangasIn import releaseBase, enumStatus, detailBase, recomendedBase
class MangaIn:

    headers = enumHeaders.chromeWindowsHeaders.value
    headers["Referer"] = "https://m440.in/"

    def __init__(self):
        pass

    def getRandomHeader(self):
        return random.choice(list(enumHeaders))

    def getRuter(self, route: str):
        if not route:
            return None
        for item in EnumRutesMangasIn:
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

    async def getDetailBook(self, route):
        try:
            result = await self.getElements(route)
            return result
        except Exception as e:
            print(e)
            return []
        
    async def getChapter(self, link:str):
        try:
            soup = await self.getSoup(url = link)
            if soup:
                print("Book page parsed successfully.")
                result = self.getImageChapter(soup)
                # Further parsing logic to be implemented
                return result
            else:
                print("Could not parse the book webpage.")
        except Exception as e:
            print(f"An error occurred: {e}")
            return None
        
    async def getElements(self, _url: str):
        soup:BeautifulSoup | None = None
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch()
                page = await browser.new_page()
                await page.goto(_url, wait_until="load")
                await page.wait_for_selector("pag.btn.btn-success.dropdown-toggle", timeout=1000)
                pag_element = page.locator("pag")
                if await pag_element.count() > 0:
                    totalNum: int | None = self.getNumberTotalPagChapter(await pag_element.inner_text())
                    totalNum = totalNum if totalNum != None else 1
                    for i in range(1, totalNum):
                        await pag_element.click() # type: ignore
                html = await page.content()
                soup = BeautifulSoup(html, "html.parser")
                await browser.close()
            _title = soup.find("h2", class_ = "widget-title").get_text() # type: ignore
            thumnail: str = soup.find("img", class_ = "img-responsive")["src"] # type: ignore
            _statusDiv = soup.find("div", "manga-name") # type: ignore
            _status = _statusDiv.find_next("a")["data-original-title"]
            chapters = soup.find_all("div", class_="col-lg-12")[-1]
            chaptersLink = chapters.find_all("a", target="_blank")
            recomendados = soup.find_all("li", class_ = ["splide__slide","p-splide__slide","splide__slide--clone"])
            rocom: list[recomendedBase] = []
            for a in recomendados:
                imagen: str = a.find("img", class_ = "img-responsive")["src"] # type: ignore
                __title = a.find("h4", class_ = "title").get_text() # type: ignore
                _autor = a.find("p", class_ = "writer").get_text() # type: ignore
                finalText = re.sub(r'[^a-z0-9\s]', '', __title)
                _urlBase = f"https://m440.in/manga/{finalText.lower().replace(" ", "-")}"
                rocom.append(recomendedBase(img = imagen, title = __title, autor =  _autor, link = _urlBase))
            caps: list[object] = []
            for a in chaptersLink:
                caps.append({"title": a.get_text(), "link": a["href"]})
            
            return detailBase(title = _title, img = thumnail, status = _status, chapters = caps, recomendados = rocom)
        except Exception as e:
            print(e)
            return[]

    async def getElementsReleases(self, numPage: int = 1) -> list[releaseBase]:
        baseUrl = f"https://m440.in/lasted?p={numPage}"
        request = requests.get(baseUrl, headers = self.getRandomHeader().value)
        try:
            request.raise_for_status()
            response = request.json()
            if "totalPages" in response and not numPage > response["totalPages"]:
                releases = []
                for item in response["data"]:
                    _img = f"https://m440.in/uploads/manga/{item["manga_slug"]}/cover/cover_250x350.jpg"
                    _link = f"https://m440.in/manga/{item["manga_slug"]}"
                    releases.append(releaseBase(title = item["manga_name"], img = _img, status = enumStatus(int(item["manga_status_id"])).name, mangaType = EnumType(int(item["manga_type_id"])).name, numChapters = item["manga_chapters"], categories = item["categories"], link = _link))
                return releases
            else:
                print("No descubri el total de paginas")
                return []  
        except requests.exceptions.RequestException as e:
            print(f"Error al realizar la solicitud: {e}")
            return []
        except json.JSONDecodeError:
            print("Error al decodificar la respuesta JSON.")
            return []
        
    def getImageChapter(self, soup:BeautifulSoup) -> list:
        box = soup.find("div", id="all")
        images = box.find_all("img", class_ ="img-responsive") # type: ignore
        listImages:list = []
        for item in images:
            print(item)
            listImages.append(item["data-src"])
        return listImages
    
    def getNumberTotalPagChapter(self, text:str | None) -> int | None:
        if text == None:
            return None
        m = re.search(r'/\s*(\d+)', text)
        return int(m.group(1)) if m else None