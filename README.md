# node-red-contrib-nbrowser
Provides a virtual web browser (a.k.a. "headless browser") appearing as a node. The web browser is based on the open source electron.atom.io and nightmarejs.org projects. The node edit panel provides the ability to easily navigate and automate most web browser operations as well as display an interactive window for easy debugging. In headless mode the browser omits downloading images and is highly optimized for speed and performance. This makes testing and automation incredibly fast and versatile. Extended features include the ability to inspect DOM elements, upload & download files, and answer common dialogs.  

By default, a node will use or create the web browser "instance" in **msg.nbrowser** property and will have a pre-added goto method to navigate to the URL from an incoming **msg.payload**. After methods have been applied, the resulting HTML source is output in the **msg.payload**. Developers have the option of analyzing content in their flow before navigating or taking additional actions on a given page by simply dropping additional nbrowser nodes in their flow diagram. When used with the **[node-red-contrib-string](https://github.com/steveorevo/node-red-contrib-string)** node and the **switch** node, **nbrowser** enables an unprecedented level of versatility and functionality to the already powerful Node-RED set of capabilities.

```
// WARNING: nbrowser is NOT sandboxed & could allow code injection by a
// malicious website owner. DO NOT use nbrowser with untrusted websites.
```

This might be useful for:

* Reading and aggregating your favorite articles
* Writing your own Instapaper clone
* Testing your web sites

Please don't use this for:

* Taking over a country politically and/or socially
* Stealing other peoples' intellectual property
* Making crappy spam sites
* Being a jerk

## Installation
Run the following command in your Node-RED user directory (typically ~/.node-red):

    npm install node-red-contrib-nbrowser

The **nbrowser** node will appear in the palette under the advanced group.

## Options
***Show browser window instance?***

Displays the Electron browser instance to aid development. Use Command (Mac) / Ctrl (Windows) + Shift + I to display developer tools & the DOM inspector. Note: image downloading is suppressed in headless mode but is turned on for convenience when this option is enabled.

***Close instance after methods?***

IMPORTANT! Use this option to destroy the browser instance after processing all methods or place an nbrowser node at the end of your flow with this option enabled to close an existing instance window. This is especially important when running in headless mode; otherwise it is not physically possible to close the window.

## Methods
The following methods can be used to navigate or analyze a given web page. Many of the methods below require a valid CSS selector to take effect. Unlike NightmereJS or PhantomJS, nbrowser will wait for the given CSS selector to appear; eliminating the need to insert additional wait methods. When present, a selector parameter may come from a literal string or any property of global, flow, or msg contexts. Selectors that fail to appear will generate a catchable timeout error.

Additional parameters may include a flow output or a context property to store an existing value. If a flow output is selected, the resulting value is often delivered in the msg.payload context property.
___
##### check
Used to check or uncheck a checkbox.
* **selector** - The CSS selector for the checkbox.
* **boolean** - True to check the checkbox or false to uncheck it.
___
##### click
Used to simulate a click event.
* **selector** - The CSS selector for a DOM element to click.
___
##### clearCookie
Used to clear a given named cookie. Providing no name will clear all cookies.
* **name** - The name of the cookie to clear or leave blank to clear all cookies.
___
##### setCookie
Set the value of a given cookie.
* **name** - The name of the cookie to set.
* **value** - The value to set the cookie.
___
##### getCookie
Retrieve the value of a named cookie.
* **name** - The name of the cookie to retrieve.
* **output** - An existing context property to place the value into or a flow output.
___
##### getHeaders
Retrieve the headers for the given web page.
* **output** - An existing context property to place the headers into or flow output (default). When using a flow output, the headers will be available in msg.payload.
___
##### getHTML
The inner HTML source code based on the given CSS selector or the entire source code for the current web page if the CSS selector parameter is left blank.
* **selector** - The CSS selector to retrieve HTML source from or blank for the entire web page.
* **output** - An existing context property to place the HTML source into or flow output (default). When using a flow output, the source will be available in msg.payload.
___
##### getText
The inner text based on the given CSS selector or the entire text for the current web page if the CSS selector parameter is left blank.
* **selector** - The CSS selector to retrieve text from or blank for the entire web page.
* **output** - An existing context property to place the text into or flow output (default). When using a flow output, the text will be available in msg.payload.
___
##### getUnfluff
The unfluff content (an automatic web page content extractor) for the current HTML source. See [node-unfluff](https://github.com/ageitgey/node-unfluff) for details.
* **output** - An existing context property to place the unfluff content into or a flow output (default). When using a flow output, the unfluff data will be available in msg.payload.
___
##### getURL
The URL of the current web page.
* **output** - An existing context property to place the URL into or flow output (default). When using a flow output, the URL will be available in msg.payload.
___
##### goBack
Navigate the browser to the previous web page.
___
##### goForward
Navigate the browser forward to a previously visited web page.
___
##### gotoURL
Navigate the browser to the web page at the given URL.
* **URL** - The URL for the web page to navigate to.
___
##### header
Adds a header override for all HTTP requests. If header is undefined, the header overrides will be reset.
* **name** - A named header item.
* **value** - A value to set for the given header item.
___
##### evalJavaScript
Evaluates the given JavaScript code for the current web page and returns the results.
* **source code** - The source code to evaluate.
* **output** - An existing context property to return results to or flow output (default). When using a flow output, the results will be available in msg.payload.
___
##### injectJavaScript
Injects the given file containing JavaScript into the current web page.
* **file** - The complete path and filename of the JavaScript file to inject.
___
##### insert
Inserts text into a selected input text element. Similar to the type method but faster and does not generate keyboard events.
* **selector** - A selector for the input text element.
* **characters** - The text to set the value of the input text element to.
___
##### isVisible
Returns whether the selected DOM element is visible (true) or not (false).
* **selector** - A selector for a DOM element.
* **output** - An existing context property to return results to or flow output (default). When using a flow output, the results will be available in msg.payload.
___
##### isPresent
Returns whether the selected DOM element is present (true) or not (false).
* **selector** - A selector for a DOM element.
* **output** - An existing context property to return results to or flow output (default). When using a flow output, the results will be available in msg.payload.
___
##### mouse
Used to simulate a mouse event on a selected DOM element.
* **selector** - The CSS selector to perform the mouse event on.
* **event** - A mouse event to perform; mouseUp, mouseDown, mouseOver, or mouseOut.
___
##### onAuthenticate
Sets the username and password for accessing a web page using basic authentication. Be sure to set this before using the gotoURL method.
* **username** - The username for authentication.
* **password** - The password for authentication.
___
##### onAlert
By default, nbrowser will ignore alert dialogs. Use this method to retrieve an alert dialog message.
* **output** - An existing context property to return the alert message to or flow output (default). When using a flow output, the alert message will be in msg.payload.
___
##### onConfirm
Use this method to answer a confirm dialog. By default, nbrowser will ignore confirm dialogs. Be sure to add this method before the gotoURL method or prior to the appearance of the confirm dialog.
* **answer** - The answer for the confirm dialog (true for OK, or false for Cancel).
* **output** - An existing context property to return the confirm results to or flow output (default). When using a flow output, the confirm results will be in msg.payload. The given results will contain an object with the confirm dialog message, and reply.
___
##### onDownload
Use this method to save a downloaded item from the web. Be sure to add this method before the gotoURL method or prior to invoking a download link.
* **file** - The path and filename of the item to be downloaded.
* **output** - An existing context property to return the download results to or flow output (default). When using a flow output, the download results will be in msg.payload.
___
##### onPrompt
Use this method to answer a prompt dialog. By default, nbrowser will ignore prompt dialogs. Be sure to add this method before the gotoURL method or prior to the appearance of the prompt dialog.
* **answer** - The answer to furnish the prompt dialog with.
* **output** - An existing context property to return the prompt results to or flow output (default). When using a flow output, the prompt results will be in msg.payload. The given results will contain an object with the prompt dialog message, default, and reply.
___
##### refresh
Refresh the current web page.
___
##### saveAs
Saves the current web page as a screenshot image, HTML, or PDF. When HTML is selected, an adjacent folder of the same filename will be generated containing any images and resources to render the page offline.
* **type** - The file type to generate; image, HTML, or PDF.
* **file** - A path and filename for the saved web page.
___
##### scrollTo
Scrolls the web page to desired position. top and left are always relative to the top left corner of the document.
* **top** - The top number of pixels to scroll the web page.
* **left** - The left number of pixels to scroll the web page.
___
##### select
Changes the selector dropdown element to the option with attribute [value=option].
* **selector** - The CSS selector for the selector dropdown element.
* **option** - The value to set for the given selector dropdown element.
___
##### type
Enters text into the given DOM element. This method mimics a user typing in a textbox and will emit the proper keyboard events.
* **selector** - The CSS selector for the desired text input element.
* **characters** - The text to type into the element.
___
##### upload
Uploads a file to the website. A selector for the given input[type="file"] must be provided. Be sure to add this method before the upload link is invoked.
* **selector** - The selector of the file input type; i.e. input[type="file"].
* **file** - The filename and path of the file to upload to the website.
___
##### userAgent
Sets the useragent used by electron.
* **useragent** - The useragent to use when communicating to the web server.
___
##### viewport
Sets the viewport size of the web browser window. This value will influence the appearance of the web page when using the saveAs method.
* **width** - The width in pixels for the web browser window size.
* **height** - The height in pixels for the web browser window size.
___
##### wait
The number of seconds to wait or the CSS selector to wait for to appear in the given web page. If a numeric is supplied, it is assumed to be the number of seconds to wait before executing subsequent methods.
* **selector or seconds** - The CSS selector to wait for to appear or the number of seconds to wait.

## Utility Functions
**removeTargetAttr** - is a utility function that is callable from the evalJavaScript method. This function is useful to prevent a new window from spawning when clicking an anchor link. Instead, the existing browser window will be used for navigation.

**msg.nbrowser_delay** - The delay between nbrowser nodes within the same flow; default is 1500ms but can be changed via the input to nbrowser. Increase this value to avoid `navigation error -3` and `ERR_ABORTED`.

## References
The method operations are derived from open source [NightmareJS](http://www.nightmarejs.org) project.
The official [node-red-contrib-nbrowser](https://github.com/steveorevo/node-red-contrib-nbrowser) project on GitHub.
