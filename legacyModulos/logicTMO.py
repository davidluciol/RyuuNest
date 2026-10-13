import re
import requests
from bs4 import BeautifulSoup
from Modelos.Itmo import ITmo
from Modelos.ItmoBook import ITmoBook
from Modelos.ItmoBook import ICapituloBook
from Modelos.ItmoBook import IServerBook
from Modelos.ItmoBook import IPartsBook
from Utils.EnumRutesTmo import EnumRutesTmo

class moduleTMO:
    
    headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    "Accept-Language": "en-US,en;q=0.9",
    }

    def __init__(self):
        pass

    def getElementsTMO(self, soup):
        try:
            books = soup.find_all("div", class_="element")
            list_populars = []
            for book in books:
                link = book.find("a")["href"]
                box = book.find("div", class_="thumbnail")
                title = box.find("h4", class_="text-truncate").text.strip()
                score = box.find("span", class_="score").text.strip()
                type_book = box.find("span", class_="book-type").text.strip()
                demography = box.find("span", class_="demography").text.strip()
                match = re.search(r"url\(['\"](.*?)['\"]\)", box.find("style").text.strip())
                img_url = ""
                if match:
                    img_url = match.group(1)         
                objectItmo = ITmo(title = title, url = link, img_url = img_url, score = score, type_book = type_book, demography = demography, time = "", scan = "")
                list_populars.append(objectItmo)
            return list_populars
        except Exception as e:
            print(f"An error occurred while parsing populars: {e}")
            return []

    def getRuterTMO(self, route):
        if not route:
            return None
        for item in EnumRutesTmo:
            if item.name == route:
                return item.value
            pass

    def getSoupTMO(self, url, urlBase = None):
        try:
            if urlBase:
                self.headers["Referer"] = urlBase
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

    def mainTMO(self, stringRoute):    
        try:
            if stringRoute == None:
                stringRoute = "home"

            url = self.getRuterTMO(stringRoute)
            soup = self.getSoupTMO(url)
            if soup:
                if stringRoute == "lastAdded":
                    popularsBooks = self.getLastAddedTMO(soup)
                    print(popularsBooks)
                    return popularsBooks
                else:
                    popularsBooks = self.getElementsTMO(soup)
                    return popularsBooks
            else:
                print("Could not parse the webpage.")
        except Exception as e:
            print(f"An error occurred: {e}")

    def getLibraryTMO(self, title, page):
        try:
            url = f"{self.getRuterTMO('library')}?title={title}&pg={page}"
            soup = self.getSoupTMO(url)
            if soup:
                libraryBooks = self.getElementsTMO(soup)
                return libraryBooks
            else:
                print("Could not parse the webpage.")
        except Exception as e:
            print(f"An error occurred: {e}")

    def getLastAddedTMO(self, soup):
        try:
            books = soup.find_all("div", class_="upload-file-row")
            list_populars = []
            for book in books:
                box = book.find("div", class_="thumbnail")
                match = re.search(r"url\(['\"](.*?)['\"]\)", box.find("style").text.strip())
                img_url = ""
                if match:
                    img_url = match.group(1) 
                link = book.find("a")["href"]
                title = box.find("h4", class_="text-truncate").text.strip()
                time = box.find("span", class_="number").text.strip()
                type_book = box.find("span", class_="book-type").text.strip()
                scan = box.find("span", class_="groups").text.strip()
                        
                objectItmo = ITmo(
                    title = title, url = link, img_url = img_url, score = "", type_book = type_book, demography = "", time = time, scan = scan)
                list_populars.append(objectItmo)
            return list_populars
        except Exception as e:
            print(f"An error occurred while parsing populars: {e}")
            return []

    async def getBookTMO(self, url) -> ITmoBook | None:
        try:
            soup = self.getSoupTMO(url)
            if soup:
                print("Book page parsed successfully.")
                result = await self.scraperBookTMO(soup, url)
                # Further parsing logic to be implemented
                return result
            else:
                print("Could not parse the book webpage.")
        except Exception as e:
            print(f"An error occurred: {e}")
            return None

    async def scraperBookTMO(self, soup, urlBase) -> ITmoBook | None:
        try:
            # Parsing logic to be implemented
            _title = " ".join(soup.find("h1", class_ = "element-title my-2").text.strip().split())
            descrp = " ".join(soup.find("p", class_ = "element-description").text.strip().split())
            box_img = soup.find("div", class_= "element-image")
            img = box_img.find("img", class_ = "book-thumbnail")["src"]
            box_complete = soup.find("div", class_ = "element-header-content-text")
            geners = [gender.text.strip() for gender in box_complete.find_all("h6")]
            status = " ".join(box_complete.find("span", class_ = "book-status").text.strip().split())
            titleAlt = [altTitle.text.strip() for altTitle in box_complete.find_all("span", class_ = "text-truncate")]
            extraData = {}
            for data in soup.find_all("div", class_ = "unchecked"):
                title = " ".join(data.find("small", class_ = "element-header-bar-element-title").text.strip().split())
                value = " ".join(data.find("span", class_ = "element-header-bar-element-number").text.strip().split())
                extraData[title] = value
            chapters = []
            for chapter in soup.find_all("li", class_ = "upload-link"):
                __title = " ".join(chapter.find("a", class_ = "btn-collapse").text.strip().split())
                servers = []
                for server in chapter.find_all("li", class_ = "list-group-item"):
                    group = {server.find("a").text.strip() : server.find("a")["href"]}
                    time = server.find("div", class_ = "text-center").text.strip()
                    _link = server.find("a", class_ = "btn btn-default btn-sm")["href"]
                    servers.append(IServerBook(name = group, date = time, link = _link, originalUrl = urlBase))
                chapters.append(ICapituloBook(title = __title, server = servers, visto = False))
            return ITmoBook(
                title = _title,
                imgUrl = img,
                description = descrp,
                generos = geners,
                estado = status,
                altTitulos= titleAlt,
                moreData= extraData,
                captiutlos= chapters
            )
        except Exception as e:
            print(f"An error occurred while parsing book details: {e}")
            return None

    async def getChapterTMO(self, _url, _urlBase) -> IPartsBook | None:
        try:
            self.headers["Referer"] = _urlBase
            resolveUrl = requests.get(_url, headers = self.headers, allow_redirects = True)
            trueUrl = resolveUrl.url.replace("paginated", "cascade")
            resolveUrl.close()
            resolveUrl = requests.get(trueUrl, headers = self.headers)
            soup = BeautifulSoup(resolveUrl.content, 'html.parser')
            if not soup:
                print("Could not parse the chapter webpage.")
                return None
            print("Chapter page parsed successfully.")
            return await self.scraperChapterBookTMO(soup)
        except Exception as e:
            print(f"An error occurred: {e}")
            return None

    async def scraperChapterBookTMO(self, soup) -> IPartsBook | None:
        try:
            boxHeader = soup.find("section", class_ = "bg-manga")
            _title = " ".join(f"{boxHeader.find("h1").text.strip().split()} {boxHeader.find("h2").text.strip().split()}")
            _parts = []
            for img in soup.find_all("div", class_ = "img-container"):
                src = img.find("img", class_ = "viewer-img")["data-src"]
                _parts.append(src)
            return IPartsBook(title = _title, parts = _parts)
        except Exception as e:
            return None