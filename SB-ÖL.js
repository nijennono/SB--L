let storeId = 433
let param = args.widgetParameter
if (param != null && param.length > 0) {
    storeId = param
}

const widget = new ListWidget()
const storeInfo = await fetchStoreInformation()
const storeCapacityW550 = await fetchAmountOfW550()
await createWidget()

// used for debugging if script runs inside the app
if (!config.runsInWidget) {
    await widget.presentSmall()
}
Script.setWidget(widget)
Script.complete()

// build the content of the widget
async function createWidget() {

    const logoImg = await getImage('dm-logo.png')

    widget.setPadding(8,8,8,8)
    const titleFontSize = 12
    const detailFontSize = 36

    let titelzeile = widget.addStack()
    titelzeile.layoutVertically()
    const titel = titelzeile.addText("SB-Öl bei dm")
    titel.font = Font.boldSystemFont(14)
    widget.addSpacer(1)

    // Raps-Oel
    let row = widget.addStack()
    row.layoutHorizontally()

    let column = row.addStack()
    column.layoutVertically()

    const W550Text = column.addText("dmBio Sonnenblumenöl : ")
    W550Text.font = Font.mediumRoundedSystemFont(11)

    const W550Count = row.addText(storeCapacityW550.toString())
    W550Count.font = Font.mediumRoundedSystemFont(11)
    if (storeCapacityW550 < 6) {
        W550Count.textColor = new Color("#E50000")
    } else {
        W550Count.textColor = new Color("#00CD66")
    }
    // widget.addSpacer(4)
	
    // shop info & logo
    let infologo = widget.addStack()
    infologo.layoutHorizontally()

    let infos = infologo.addStack()
    infos.layoutVertically()

    const street = infos.addText(storeInfo.address.street)
    street.font = Font.regularSystemFont(8)

    const zipCity = infos.addText(storeInfo.address.zip + " " + storeInfo.address.city)
    zipCity.font = Font.regularSystemFont(8)

    let currentTime = new Date().toLocaleTimeString('de-DE', { hour: "numeric", minute: "numeric" })
    let currentDay = new Date().getDay()
    let isOpen
    if (currentDay > 0) {
        const todaysOpeningHour = storeInfo.openingHours[currentDay-1].timeRanges[0].opening
        const todaysClosingHour = storeInfo.openingHours[currentDay-1].timeRanges[0].closing
        const range = [todaysOpeningHour, todaysClosingHour];
        isOpen = isInRange(currentTime, range)
    } else {
        isOpen = false
    }

    let shopStateText
    if (isOpen) {
        shopStateText = infos.addText('Geöffnet')
        shopStateText.textColor = new Color("#00CD66")
    } else {
        shopStateText = infos.addText('Geschlossen')
        shopStateText.textColor = new Color("#E50000")
    }
    shopStateText.font = Font.mediumSystemFont(8)
    infologo.addSpacer(20)

    const logoImageStack = infologo.addStack()
    logoImageStack.layoutVertically()
    logoImageStack.addSpacer(0)
    const logoImageStack2 = logoImageStack.addStack()
    logoImageStack2.backgroundColor = new Color("#ffffff", 1.0)
    logoImageStack2.cornerRadius = 6
    const logo = logoImageStack2.addImage(logoImg)
    logo.imageSize = new Size(25, 25)
    logo.rightAlignImage()
    
}

// fetches the amount of weizen 550 packages
async function fetchAmountOfW550() {
    let url
    let counter = 0
        url = 'https://products.dm.de/store-availability/DE/availability?dans=510708&storeNumbers=' + storeId
        const req = new Request(url)
        const apiResult = await req.loadJSON()
        for (var i in apiResult.storeAvailabilities) {
            counter += apiResult.storeAvailabilities[i][0].stockLevel
        }
    return counter
}

// fetches information of the configured store, e.g. opening hours, address etc.
async function fetchStoreInformation() {
    let url
        url = 'https://store-data-service.services.dmtech.com/stores/item/de/' + storeId
        widget.url = 'https://www.dm.de/search?query=510708&searchType=product'
    let req = new Request(url)
    let apiResult = await req.loadJSON()
    return apiResult
}

// checks whether the store is currently open or closed
function isInRange(value, range) {
    return value >= range[0] && value <= range[1];
}

// get images from local filestore or download them once
async function getImage(image) {
    let fm = FileManager.local()
    let dir = fm.documentsDirectory()
    let path = fm.joinPath(dir, image)
    if (fm.fileExists(path)) {
        return fm.readImage(path)
    } else {
        // download once
        let imageUrl
        switch (image) {
            case 'dm-logo.png':
                imageUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Dm_Logo.svg/300px-Dm_Logo.svg.png"
                break
            default:
                console.log(`Sorry, couldn't find ${image}.`);
        }
        let iconImage = await loadImage(imageUrl)
        fm.writeImage(path, iconImage)
        return iconImage
    }
}

// helper function to download an image from a given url
async function loadImage(imgUrl) {
    const req = new Request(imgUrl)
    return await req.loadImage()
}


// End of script