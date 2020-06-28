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
	'.post-content-main',
	'.article__body__content',
	'.post-body',
	'.article__body',
	'.article-text',
	'main',
	'[role=main]',
	'#content',
	'.content',
	'.page-content',
	'.post-content',
	'.main-content',
	'.container',
	'.Container',
	'.main',
	'section',
]

const paragraph_selectors = [
	...mains.map(m => `${m} p`),
	'body p',
	...mains,
	'body',
]

function getParagraph($) {
	for (const sel of paragraph_selectors) {
		let text = $(sel)
			.filter((i, t) => {
				if ($(t).text().length < 30) return false
				if ($(t).hasClass('metadata')) return false
				if ($(t).is('[aria-hidden=true]')) return false
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

function isHost(host, match) {
	return host == match || match.endsWith('.'+host)
}

function getImage(url, $) {
	if (isHost('github.com', new URL(url).hostname)) {
		// Special case for GitHub - look for useful images in README
		const imgs = $('#readme img').filter((i, t) => {
			const $t = $(t)
			if ($t.attr('src').toLowerCase().includes('badge')) return false
			return true
		})
		if (imgs.length > 0) {
			return URLToolkit.buildAbsoluteURL(url, imgs.first().attr('src'))
		}
	}
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
