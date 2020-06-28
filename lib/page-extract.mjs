import crypto from 'crypto'
import fetch from 'node-fetch'
import fs from 'fs-extra'
import cheerio from 'cheerio'
import compare from 'compare-function'
import URLToolkit from 'url-toolkit'
import htmlEntities from 'html-entities'

const entities = new htmlEntities.AllHtmlEntities()

async function gethtml(url) {
	const urlhash = crypto.createHash("sha256").update(url, "binary")
		.digest("base64")
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '')
	const cache = `cache/url/${urlhash}`
	if (await fs.exists(cache)) {
		return fs.readFile(cache)
	}
	const res = await fetch(url)
	if (!res.ok) {
		throw new Error(`HTTP error: ${res.status} for ${url}`)
	}
	let ret
	if (res.headers.get('Content-Type').startsWith('text/html')) {
		ret = await res.text()
	} else {
		ret = ''
	}
	await fs.writeFile(cache, ret)
	return ret
}

const mains = [,
	'.post-body',
	'.post-content-main',
	'main',
	'[role=main]',
	'.content',
	'.page-content',
	'.post-content',
	'.main-content',
	'.main',
	'section',
]

function textof($, sel) {
	return $(sel).filter((i, t) => {
		if ($(t).text().length < 30) return false
		if ($(t).hasClass('metadata')) return false
		return true
	}).first().text()
}

const paragraph_selectors = [
	...mains.map(m => `${m} p`),
	'p',
	...mains,
	'body',
]

function getParagraph($) {
	for (const sel of paragraph_selectors) {
		let text = $(sel)
			.filter((i, t) => {
				if ($(t).text().length < 30) return false
				if ($(t).hasClass('metadata')) return false
				return true
			}).first().text()
		if (!text) continue
		text = entities.decode(text)
		if (text.length > 850) {
			return text.slice(0, 800)+'...'
		} else {
			return text
		}
	}
}

function getImage(url, $) {
	let tries = [
		$('meta[property="og:image"]').attr('content'),
		$('meta[property="twitter:image"]').attr('content'),
		...mains.map(m => $(m+' img').first().attr('src')),
		// Don't go hunting for images elsewhere in the body if there's a main with nothing in it---
		// otherwise we go hunting through the header and footer and usually end up with a sharing icon or something.
		(mains.some(m => $(m).length > 0) ? false : $('body img').first().attr('src')),
	].filter(t => t)
	.filter(t => t !== 'https://s4.reutersmedia.net/resources_v2/images/rcom-default.png')
	if (tries.length > 0) {
		return URLToolkit.buildAbsoluteURL(url, tries[0])
	} else {
		return null
	}
}

export async function page_info(url) {
	const $ = cheerio.load(await gethtml(url), {xml: {
		normalizeWhitespace: true,
	}})
	$('script').remove()
	
	return {
		paragraph: getParagraph($),
		image: getImage(url, $),
	}
}
