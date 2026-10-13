import random
import requests
from requests_html import AsyncHTMLSession
from bs4 import BeautifulSoup
from Utils.EnumRutesMangaFox import EnumRutesMangasFox
from Utils.EnumHeaders import enumHeaders
from Modelos.IFoxManga import homeModel, BookChapter, bookDetail

class logicFoxMangas:

    headers = enumHeaders.chromeWindowsHeaders.value

    def __init__(self):
        pass

    def getRandomHeader(self) -> enumHeaders:
        return random.choice(list(enumHeaders))

    async def getPage(self, route: str):
        try:
            url = self.getRuter(route)
            soup = await self.getSoup(url)
            if soup:
                return self.getMainElements(soup)
            else:
                print("Could not parse the webpage.")
        except Exception as e:
            print(e)
    
    async def getBookDetails(self, route: str):
        try:
            _soup = await self.getSoup(route)
            return await self.getDetailElements(soup = _soup)
        except Exception as e:
            print(e)    
    
    async def getBookChapter(self, link: str):
        try:
            await self.getImagesPerPages(link)
        except Exception as e:
            print(e)    

    def getRuter(self, route: str):
        if not route:
            return None
        for item in EnumRutesMangasFox:
            if item.name == route:
                return item.value
            pass

    async def getSoup(self, url):
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
    
    def getMainElements(self, soup) -> list:
        box = soup.find_all("ul", class_ = "manga-list-1-list")
        prefix = 1
        if len(box) == 0:
            box = soup.find_all("ul", class_ = "manga-list-4-list")
            prefix = 4
        manga = []
        for item in box:
            tempCover = f"manga-list-{prefix}-cover"
            for erase in item(["ul"]):
                erase.decompose()
            lis = item.find_all("li")
            for li in lis:
                baseLink = self.getRuter("home")
                _link = f"{baseLink}{li.find("a")["href"]}"
                _title = li.find("a")["title"]
                imgSrc = li.find("img", class_ = tempCover)["src"]
                _score = ""
                if prefix == 4:
                    _score = "0.00"
                else:
                    _score = li.find("span", class_ = "item-score").text.strip()
                manga.append(homeModel(title = _title, link = _link, img = imgSrc, score = _score))
        return manga

    async def getDetailElements(self, soup) -> bookDetail | str:
        try:
            _title = soup.find("span", class_ = "detail-info-right-title-font").get_text()
            p = soup.find("p", class_ = "detail-info-right-say")
            a_autor = {
                "autor" : p.find("a")["href"],
                "link" : p.find("a")["title"]
            }
            p_tags = soup.find("p", class_ = "detail-info-right-tag-list")
            a_tags = p_tags.find_all("a")
            _tags = []
            for i in a_tags:
                temp = {
                    "title" : i["title"],
                    "link" : i["href"]
                }
                _tags.append(temp)
            _status = soup.find("span", class_ = "detail-info-right-title-tip").get_text()
            _stars = soup.find("span", class_ = "item-score").get_text()
            _description = soup.find("p", class_ = "detail-info-right-content").get_text()
            portada = soup.find("img", class_ = "detail-info-cover-img")["src"]
            others = soup.find("ul", class_ = "manga-list-2-list-s")
            others_li = others.find_all("li")
            _others = []
            for item in others_li:
                _p = item.find("p", class_ = "manga-list-2-item-title")
                a = {
                    "title" : _p.find("a")["title"],
                    "link" : _p.find("a")["href"]
                }
                _others.append(a)
            listChapters = []
            ul = soup.find("ul", class_ = "detail-main-list")
            lis = ul.find_all("li")
            for a in lis:
                item_a = a.find("a")
                cap = {
                    "title" : item_a.find("p", class_ = "title3").get_text(),
                    "link" : item_a["href"],
                    "fecha" : item_a.find("p", class_ = "title2").get_text()
                }
                listChapters.append(cap)
            return bookDetail(title = _title, autor = a_autor, status = _status, tags = _tags, description = _description, stars = _stars, thumbnail = portada, chapters = listChapters, otherMangasAutors = _others)
        except Exception as b:
            return f"{b}"

    async def getImagesPerPages(self, _url: str) -> BookChapter:
        try:
            session = AsyncHTMLSession()
            request = await session.get(url = _url, headers = self.getRandomHeader().value) # type: ignore
            await request.html.arender()
            soup = BeautifulSoup(request.html.html, 'html.parser')
            _title:str = soup.select_one("p > a").get_text() # type: ignore
            chapter:str = soup.find("p", class_ = "reader-header-title-2").get_text() # type: ignore
            maxChapter:int = self.getMaxNumImages(soup = soup)
            finalLinks = self.getListPages(_url, maxChapter)
            img: str = soup.find("img", class_ = "reader-main-img")["src"] # type: ignore
            await session.close()
            listImages: list[str] = await self.getImageChapter(pages = finalLinks, firstImage = img, loader = soup.find("img", class_ = "reader-main-img")["data-loading-img"]) # type: ignore
            return BookChapter(title = _title, numChapter = chapter, listPages = listImages)
        except Exception as e:
            return BookChapter(title = "Error", numChapter = f"{e}", listPages = ["a", "b", "c"])
    
    def getMaxNumImages(self, soup) -> int:
        box = soup.find_all("div", class_ = ["pager-list", "cp-pager-list"])
        filtro = [r for r in box if not (r.has_attr("style") and "display:none" in r["style"])] # type: ignore
        box1 = filtro[0]
        num = []
        for pagina in box1.find_all("a"):
            if pagina.has_attr("data-page"):
                num.append(int(pagina["data-page"]))
        return max(num)
    
    def getListPages(self, baseUrl: str, maxChapter: int) -> list[str]:
        _baseUrl = baseUrl.rsplit("/", 1)[0] + "/"
        finalLinks: list[str] = []
        for i in range(2, maxChapter+1):
            finalLinks.append(f"{_baseUrl}{i}.html")
        return finalLinks
    
    async def getImageChapter(self, pages: list, firstImage: str, loader: str) -> list[str] | object:
        images: list[str] = []
        tries: list[str] = []
        images.append(firstImage)
        try:
            for page in pages:
                asession = AsyncHTMLSession()
                result = await asession.get(url = page, headers = self.getRandomHeader().value) # type: ignore
                if result.status_code >= 500:
                    images.append(f"{result.status_code}")
                if result.status_code == 429 | result.status_code == 430:
                    tries.append(page)
                await result.html.arender()
                soup = BeautifulSoup(result.html.html, 'html.parser')
                img: str = soup.find("img", class_ = "reader-main-img")["src"] # type: ignore
                images.append(img)
                await asession.close()
            if len(tries) > 0:
                for trie in tries:
                    i = 0
                    while(i < 3):
                        asession = AsyncHTMLSession()
                        result = await asession.get(url = trie, headers = self.getRandomHeader().value) # type: ignore
                        if result.status_code == 200:
                            await result.html.arender()
                            soup = BeautifulSoup(result.html.html, 'html.parser')
                            img: str = soup.find("img", class_ = "reader-main-img")["src"] # type: ignore
                            images.append(img)
                            print(f"La Imagen que se intento fue: {img}")
                        await asession.close()
                        i += 1
            return images
        except Exception as a:
            return [f"{a}"]