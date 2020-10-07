# crawler

## How to run 
`node index.js`

## Architecture

* it uses Thread Pool to run workers
* Worker basicallt call the URL and passes html source to cheerio to find the links and assests and returns back to parent
* parent get the page, links in it and assets and put them in a map called visitedLinks and also add new links to the queue
* Implemented a very basic pub/sub queue so that parent can subsribe and publish

## Todo (improvements)

* There should be some more todo on error management especially when thing go wrong on th remote server side. 
* we can use real queue to manage the error cases and 
* we can persist the visitedLinks to database 
* we can use HTTP OPTIONS to check last modified date of the URL and do not visit if it is not changed, so that we reduce the http calls and improve performance. 
